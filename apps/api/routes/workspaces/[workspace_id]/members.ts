import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/workspaces/[workspace_id]/members - Get workspace members
export async function GET(
  request: NextRequest,
  { params }: { params: { workspace_id: string } }
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
    const workspaceId = params.workspace_id;

    // Check if user has access
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

    // Get members with user info
    const { data: members, error } = await supabase
      .from('users_workspaces')
      .select(`
        id,
        user_id,
        workspace_id,
        role,
        joined_at,
        auth.users!inner(email, user_metadata)
      `)
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    return NextResponse.json(members || []);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspace_id]/invite - Invite user to workspace
export async function POST(
  request: NextRequest,
  { params }: { params: { workspace_id: string } }
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
    const workspaceId = params.workspace_id;
    const { email, role = 'member' } = await request.json();

    // Check if user is workspace owner
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Only owner can invite users' },
        { status: 403 }
      );
    }

    // Find user by email
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const invitedUserId = users[0].id;

    // Check if already member
    const { data: existing } = await supabase
      .from('users_workspaces')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', invitedUserId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      );
    }

    // Add user to workspace
    const { data: member, error } = await supabase
      .from('users_workspaces')
      .insert([
        {
          user_id: invitedUserId,
          workspace_id: workspaceId,
          role,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert([
      {
        workspace_id: workspaceId,
        user_id: userId,
        action_type: 'user_invited',
        action_description: `Invited ${email} to workspace`,
        metadata: { invited_user_id: invitedUserId, role },
      },
    ]);

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[workspace_id]/members/[userId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspace_id: string; userId: string } }
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
    const workspaceId = params.workspace_id;
    const memberId = params.userId;
    const { role } = await request.json();

    // Check if user is owner
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Only owner can update roles' },
        { status: 403 }
      );
    }

    // Can't change owner role
    if (memberId === workspace.owner_id && role !== 'owner') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 400 }
      );
    }

    // Update member
    const { data: updated, error } = await supabase
      .from('users_workspaces')
      .update({ role })
      .match({ workspace_id: workspaceId, user_id: memberId })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspace_id]/members/[userId] - Remove member from workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspace_id: string; userId: string } }
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
    const workspaceId = params.workspace_id;
    const memberId = params.userId;

    // Check if user is owner
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.owner_id !== userId && userId !== memberId) {
      return NextResponse.json(
        { error: 'Only owner can remove members' },
        { status: 403 }
      );
    }

    // Can't remove owner
    if (memberId === workspace.owner_id) {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 400 }
      );
    }

    // Remove member
    const { error } = await supabase
      .from('users_workspaces')
      .delete()
      .match({ workspace_id: workspaceId, user_id: memberId });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
