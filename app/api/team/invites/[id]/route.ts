/**
 * API Route: Manage Individual Workspace Invitation
 * DELETE /api/team/invites/[id] - Cancel invitation
 * PATCH /api/team/invites/[id] - Resend invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/services/email-service';

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

    const inviteId = params.id;

    // Get the invitation
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .select('*, workspaces(name)')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to cancel the invite
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invite.workspace_id)
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
        { error: 'You do not have permission to cancel invitations' },
        { status: 403 }
      );
    }

    // Update the invitation status to cancelled
    const { error: updateError } = await supabase
      .from('workspace_invites')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', inviteId);

    if (updateError) {
      console.error('[CancelInvite] Error updating invite:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    // Send cancellation email
    const emailResult = await emailService.sendCancellationEmail({
      to: invite.email,
      workspaceName: invite.workspaces?.name || 'the workspace',
    });

    if (!emailResult.success) {
      console.error('[CancelInvite] Failed to send cancellation email:', emailResult.error);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      organization_id: invite.workspace_id,
      action: 'CANCEL_INVITATION',
      entity_type: 'workspace_invite',
      entity_id: invite.id,
      metadata: {
        email: invite.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    console.error('[CancelInvite] Unexpected error:', error);
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

    const inviteId = params.id;

    // Get the invitation
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .select('*, workspaces(name)')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is still pending
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only resend pending invitations' },
        { status: 400 }
      );
    }

    // Check if user has permission to resend the invite
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invite.workspace_id)
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
        { error: 'You do not have permission to resend invitations' },
        { status: 403 }
      );
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    
    if (expiresAt < now) {
      // Extend expiration by 7 days
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      await supabase
        .from('workspace_invites')
        .update({
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', inviteId);
    }

    // Get inviter's name
    const { data: inviter } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const inviterName = inviter?.full_name || inviter?.email || 'A team member';

    // Send reminder email
    const emailResult = await emailService.sendReminderEmail({
      to: invite.email,
      workspaceName: invite.workspaces?.name || 'the workspace',
      inviteToken: invite.token,
      expiresAt: new Date(invite.expires_at),
    });

    if (!emailResult.success) {
      console.error('[ResendInvite] Failed to send reminder email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send reminder email' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      organization_id: invite.workspace_id,
      action: 'RESEND_INVITATION',
      entity_type: 'workspace_invite',
      entity_id: invite.id,
      metadata: {
        email: invite.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
    });
  } catch (error) {
    console.error('[ResendInvite] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
