import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/workspaces/[id] - Get a specific workspace
export async function GET(
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

    const workspaceId = params.id;
    const userId = session.user.id;

    // Check if user has access to this workspace
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (error || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check permissions
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

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[id] - Update a workspace
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

    const workspaceId = params.id;
    const userId = session.user.id;
    const updates = await request.json();

    // Check if user is owner
    const { data: workspace, error: fetchError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (fetchError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Only workspace owner can update' },
        { status: 403 }
      );
    }

    // Update workspace
    const { data: updated, error } = await supabase
      .from('workspaces')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Delete a workspace
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

    const workspaceId = params.id;
    const userId = session.user.id;

    // Check if user is owner
    const { data: workspace, error: fetchError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (fetchError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Only workspace owner can delete' },
        { status: 403 }
      );
    }

    // Delete workspace (cascade will delete related data)
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
