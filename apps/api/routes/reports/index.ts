import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/reports - Get reports for a workspace
export async function GET(request: NextRequest) {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspace_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const isOwner = workspace.owner_id === userId;
    const { data: membership } = await supabase
      .from('users_workspaces')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!isOwner && !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get reports
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(reports || []);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const {
      workspace_id,
      title,
      description,
      report_type,
      file_format,
      data: reportData,
    } = await request.json();

    if (!workspace_id || !title || !report_type) {
      return NextResponse.json(
        { error: 'workspace_id, title, and report_type are required' },
        { status: 400 }
      );
    }

    // Check permissions
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspace_id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const isOwner = workspace.owner_id === userId;
    const { data: membership } = await supabase
      .from('users_workspaces')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('user_id', userId)
      .single();

    if (!isOwner && !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create report
    const { data: report, error } = await supabase
      .from('reports')
      .insert([
        {
          workspace_id,
          created_by: userId,
          title,
          description,
          report_type,
          file_format,
          data_json: reportData || {},
          is_public: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert([
      {
        workspace_id,
        user_id: userId,
        action_type: 'report_created',
        action_description: `Created report: ${title}`,
        metadata: { report_id: report.id, report_type },
      },
    ]);

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
