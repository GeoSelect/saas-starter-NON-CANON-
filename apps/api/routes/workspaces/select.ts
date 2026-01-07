import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/workspaces/select
 * 
 * Select/switch the active workspace for the current user.
 * Sets an httpOnly cookie to track the active workspace.
 * Logs WORKSPACE_SWITCH audit event.
 * 
 * Request body:
 * {
 *   workspace_id: string (UUID)
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   workspace_id: string,
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { workspace_id } = await request.json();

    // Validate workspace_id is provided
    if (!workspace_id || typeof workspace_id !== 'string') {
      return NextResponse.json(
        { error: 'workspace_id is required and must be a string', success: false },
        { status: 400 }
      );
    }

    // 2. Verify workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found', success: false },
        { status: 404 }
      );
    }

    // 3. Verify user is member of workspace
    const { data: workspaceOwner } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspace_id)
      .single();

    const isOwner = workspaceOwner?.owner_id === userId;

    const { data: membership } = await supabase
      .from('users_workspaces')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', userId)
      .single();

    if (!isOwner && !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace', success: false },
        { status: 403 }
      );
    }

    // 4. Get previous active workspace from cookie (if exists)
    const previousWorkspaceId = request.cookies.get('active_workspace')?.value;

    // 5. Create audit event WORKSPACE_SWITCH
    const clientIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const auditData = {
      source: 'ui',
      previousWorkspaceId: previousWorkspaceId || null,
      newWorkspaceId: workspace_id,
    };

    // Log the switch event
    await supabase
      .from('activity_logs')
      .insert([
        {
          workspace_id,
          user_id: userId,
          action_type: 'workspace_switch',
          action_description: `Switched to workspace`,
          metadata: auditData,
          ip_address: clientIp,
          user_agent: request.headers.get('user-agent') || 'unknown',
        },
      ]);

    // 6. Set httpOnly cookie with active_workspace
    const response = NextResponse.json(
      {
        success: true,
        workspace_id,
        message: 'Successfully switched workspace',
      },
      { status: 200 }
    );

    // Set httpOnly, secure, sameSite cookie
    response.cookies.set('active_workspace', workspace_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    console.error('Error selecting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to select workspace', success: false },
      { status: 500 }
    );
  }
}
