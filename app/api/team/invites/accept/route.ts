/**
 * API Route: Accept Workspace Invitation
 * POST /api/team/invites/accept
 * 
 * Allows a user to accept an invitation using a token
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

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get the invitation by token
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .select('*, workspaces(name), users:invited_by(full_name, email)')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if invitation is still pending
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: `This invitation has already been ${invite.status}` },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    
    if (expiresAt < now) {
      // Update status to expired
      await supabase
        .from('workspace_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Verify the invitation email matches the user's email
    if (invite.email !== user.email) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      // Update invitation to accepted anyway
      await supabase
        .from('workspace_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      return NextResponse.json(
        { error: 'You are already a member of this workspace' },
        { status: 409 }
      );
    }

    // Add user to workspace
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
      });

    if (memberError) {
      console.error('[AcceptInvite] Error adding member:', memberError);
      return NextResponse.json(
        { error: 'Failed to add you to the workspace' },
        { status: 500 }
      );
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('workspace_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    if (updateError) {
      console.error('[AcceptInvite] Error updating invitation:', updateError);
    }

    // Send welcome email
    const inviterName = invite.users?.full_name || invite.users?.email || 'A team member';
    const emailResult = await emailService.sendWelcomeEmail({
      to: user.email!,
      workspaceName: invite.workspaces?.name || 'the workspace',
      inviterName,
    });

    if (!emailResult.success) {
      console.error('[AcceptInvite] Failed to send welcome email:', emailResult.error);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      organization_id: invite.workspace_id,
      action: 'ACCEPT_INVITATION',
      entity_type: 'workspace_invite',
      entity_id: invite.id,
      metadata: {
        email: invite.email,
        role: invite.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      workspace: {
        id: invite.workspace_id,
        name: invite.workspaces?.name,
      },
    });
  } catch (error) {
    console.error('[AcceptInvite] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
