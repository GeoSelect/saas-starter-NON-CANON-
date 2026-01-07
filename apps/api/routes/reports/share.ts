import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/reports/[id]/share - Create a shared link for a report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const reportId = params.id;
    const { password, expires_in_days, max_downloads } = await request.json();

    // Get report
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check permissions
    if (report.created_by !== userId) {
      return NextResponse.json(
        { error: 'Only report creator can share' },
        { status: 403 }
      );
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    let passwordHash = null;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expires_in_days) {
      const now = new Date();
      expiresAt = new Date(now.getTime() + expires_in_days * 24 * 60 * 60 * 1000);
    }

    // Create shared report record
    const { data: sharedReport, error } = await supabase
      .from('shared_reports')
      .insert([
        {
          report_id: reportId,
          share_token: shareToken,
          shared_by: userId,
          password_hash: passwordHash,
          expires_at: expiresAt?.toISOString(),
          max_downloads: max_downloads || null,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert([
      {
        workspace_id: report.workspace_id,
        user_id: userId,
        action_type: 'report_shared',
        action_description: `Shared report: ${report.title}`,
        metadata: {
          report_id: reportId,
          share_token: shareToken,
          has_password: !!password,
          expires_in_days,
        },
      },
    ]);

    // Return share info (don't expose password hash)
    const {
      password_hash,
      ...shareInfo
    } = sharedReport;

    return NextResponse.json(
      {
        ...shareInfo,
        share_url: `${process.env.NEXT_PUBLIC_DOMAIN}/reports/shared/${shareToken}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sharing report:', error);
    return NextResponse.json(
      { error: 'Failed to share report' },
      { status: 500 }
    );
  }
}

// GET /api/reports/shared/[token] - Get a shared report (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const shareToken = params.token;
    const passwordParam = request.nextUrl.searchParams.get('password');

    // Get shared report record
    const { data: sharedReport, error: shareError } = await supabase
      .from('shared_reports')
      .select('*')
      .eq('share_token', shareToken)
      .single();

    if (shareError || !sharedReport) {
      return NextResponse.json(
        { error: 'Shared report not found' },
        { status: 404 }
      );
    }

    // Check if link is still active
    if (!sharedReport.is_active) {
      return NextResponse.json({ error: 'Link is disabled' }, { status: 403 });
    }

    // Check expiration
    if (sharedReport.expires_at) {
      const expirationDate = new Date(sharedReport.expires_at);
      if (expirationDate < new Date()) {
        return NextResponse.json({ error: 'Link has expired' }, { status: 403 });
      }
    }

    // Check download limit
    if (
      sharedReport.max_downloads &&
      sharedReport.download_count >= sharedReport.max_downloads
    ) {
      return NextResponse.json(
        { error: 'Download limit reached' },
        { status: 403 }
      );
    }

    // Check password if required
    if (sharedReport.password_hash) {
      if (!passwordParam) {
        return NextResponse.json(
          { error: 'Password required' },
          { status: 403 }
        );
      }

      const passwordMatch = await bcrypt.compare(
        passwordParam,
        sharedReport.password_hash
      );

      if (!passwordMatch) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
      }
    }

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', sharedReport.report_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Increment download count
    await supabase
      .from('shared_reports')
      .update({ download_count: sharedReport.download_count + 1 })
      .eq('id', sharedReport.id);

    // Log activity
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    await supabase.from('activity_logs').insert([
      {
        workspace_id: report.workspace_id,
        action_type: 'report_downloaded',
        action_description: `Downloaded shared report: ${report.title}`,
        metadata: { report_id: report.id, share_token: shareToken },
        ip_address: clientIp,
        user_agent: request.headers.get('user-agent'),
      },
    ]);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching shared report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
