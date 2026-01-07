import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/reports/[id] - Get a specific report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    const reportId = params.id;

    // Get report
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check permissions
    if (!userId) {
      // Check if it's a public report
      if (!report.is_public) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // Check if user has access to workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', report.workspace_id)
        .single();

      if (workspace) {
        const isOwner = workspace.owner_id === userId;
        const { data: membership } = await supabase
          .from('users_workspaces')
          .select('*')
          .eq('workspace_id', report.workspace_id)
          .eq('user_id', userId)
          .single();

        if (!isOwner && !membership && !report.is_public) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/[id] - Update a report
export async function PATCH(
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
    const updates = await request.json();

    // Get report
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check permissions (only creator can update)
    if (report.created_by !== userId) {
      return NextResponse.json(
        { error: 'Only report creator can update' },
        { status: 403 }
      );
    }

    // Update report
    const { data: updated, error } = await supabase
      .from('reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
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
        { error: 'Only report creator can delete' },
        { status: 403 }
      );
    }

    // Delete report
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
