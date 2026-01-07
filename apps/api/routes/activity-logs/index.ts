import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/activity-logs - Get activity logs for a workspace
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
    const actionType = searchParams.get('action_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
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

    // Build query
    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    return NextResponse.json(logs || []);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

// POST /api/activity-logs - Create a new activity log
export async function POST(request: NextRequest) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    const {
      workspace_id,
      action_type,
      action_description,
      metadata,
      ip_address,
      user_agent,
    } = await request.json();

    if (!workspace_id || !action_type || !action_description) {
      return NextResponse.json(
        { error: 'workspace_id, action_type, and action_description are required' },
        { status: 400 }
      );
    }

    // Optional: Check if user has access to this workspace
    if (userId) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspace_id)
        .single();

      if (workspace) {
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
      }
    }

    // Get client IP
    const clientIp =
      ip_address ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const clientUserAgent = user_agent || request.headers.get('user-agent') || 'unknown';

    // Create activity log
    const { data: log, error } = await supabase
      .from('activity_logs')
      .insert([
        {
          workspace_id,
          user_id: userId,
          action_type,
          action_description,
          metadata: metadata || {},
          ip_address: clientIp,
          user_agent: clientUserAgent,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json(
      { error: 'Failed to create activity log' },
      { status: 500 }
    );
  }
}
