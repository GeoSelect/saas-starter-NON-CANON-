/**
 * API Route: Manage Individual Team Member
 * DELETE /api/team/members/[id] - Remove member from workspace
 * PATCH /api/team/members/[id] - Update member role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for admin operations
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const memberId = params.id;

    // Get the member to be removed
    const { data: targetMember, error: targetError } = await supabase
      .from('workspace_members')
      .select('*, workspaces(name)')
      .eq('id', memberId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if the current user has permission to remove members
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', targetMember.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to remove team members' },
        { status: 403 }
      );
    }

    // Prevent removing the owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the workspace owner' },
        { status: 403 }
      );
    }

    // Admins can't remove other admins unless they're the owner
    if (targetMember.role === 'admin' && membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the workspace owner can remove administrators' },
        { status: 403 }
      );
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('[RemoveMember] Error removing member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove team member' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      organization_id: targetMember.workspace_id,
      action: 'REMOVE_TEAM_MEMBER',
      entity_type: 'workspace_member',
      entity_id: targetMember.id,
      metadata: {
        removed_user_id: targetMember.user_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('[RemoveMember] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const memberId = params.id;

    // Parse request body
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be owner, admin, or member' },
        { status: 400 }
      );
    }

    // Get the member to be updated
    const { data: targetMember, error: targetError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if the current user has permission to update roles
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', targetMember.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    // Only owners can change roles
    if (membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the workspace owner can change member roles' },
        { status: 403 }
      );
    }

    // Prevent changing the owner's role
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change the workspace owner\'s role' },
        { status: 403 }
      );
    }

    // Update the member's role
    const { error: updateError } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('id', memberId);

    if (updateError) {
      console.error('[UpdateMemberRole] Error updating role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      organization_id: targetMember.workspace_id,
      action: 'UPDATE_MEMBER_ROLE',
      entity_type: 'workspace_member',
      entity_id: targetMember.id,
      metadata: {
        user_id: targetMember.user_id,
        old_role: targetMember.role,
        new_role: role,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully',
    });
  } catch (error) {
    console.error('[UpdateMemberRole] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
