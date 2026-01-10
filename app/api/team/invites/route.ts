/**
 * API Route: Create Workspace Invitation
 * POST /api/team/invites
 * 
 * Creates a new invitation for a user to join the workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { emailService } from '@/lib/services/email-service';
import { getEntitlementStatus } from '@/lib/services/entitlements';
import { PLAN_DEFINITIONS } from '@/lib/plans/definitions';

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
    const { email, role = 'member', workspaceId } = body;

    // Validate input
    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: 'Email and workspaceId are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be owner, admin, or member' },
        { status: 400 }
      );
    }

    // Check if user is a member of the workspace with admin/owner role
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
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
        { error: 'You do not have permission to invite members' },
        { status: 403 }
      );
    }

    // Get workspace details
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check entitlements - verify team size limit
    const { data: currentMembers } = await supabase
      .from('workspace_members')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId);

    const { data: pendingInvites } = await supabase
      .from('workspace_invites')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending');

    // Get workspace entitlements
    const { data: entitlements } = await supabase
      .from('workspace_entitlements')
      .select('plan_tier, limits')
      .eq('workspace_id', workspaceId)
      .single();

    const planTier = entitlements?.plan_tier || 'free';
    const plan = PLAN_DEFINITIONS[planTier === 'pro' ? 'studio' : planTier === 'enterprise' ? 'portfolio' : 'home'];
    
    const currentMemberCount = currentMembers?.length || 0;
    const pendingInviteCount = pendingInvites?.length || 0;
    const totalCount = currentMemberCount + pendingInviteCount;

    if (totalCount >= plan.limits.userLimit) {
      return NextResponse.json(
        { 
          error: `Team size limit reached. Your ${plan.displayName} plan allows up to ${plan.limits.userLimit} members.`,
          code: 'ENTITLEMENT_LIMIT_REACHED',
          currentCount: currentMemberCount,
          pendingCount: pendingInviteCount,
          limit: plan.limits.userLimit,
        },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'This user is already a member of the workspace' },
        { status: 409 }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from('workspace_invites')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 409 }
      );
    }

    // Generate unique invite token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create the invitation
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .insert({
        workspace_id: workspaceId,
        email,
        role,
        invited_by: user.id,
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('[CreateInvite] Error creating invite:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Get inviter's name
    const { data: inviter } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const inviterName = inviter?.full_name || inviter?.email || 'A team member';

    // Send invitation email
    const emailResult = await emailService.sendInviteEmail({
      to: email,
      inviterName,
      workspaceName: workspace.name,
      inviteToken: token,
      expiresAt,
    });

    if (!emailResult.success) {
      console.error('[CreateInvite] Failed to send email:', emailResult.error);
      // Continue anyway - the invite was created
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      organization_id: workspaceId,
      action: 'INVITE_TEAM_MEMBER',
      entity_type: 'workspace_invite',
      entity_id: invite.id,
      metadata: {
        email,
        role,
      },
    });

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
      },
    });
  } catch (error) {
    console.error('[CreateInvite] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Get workspaceId from query params
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    // Auto-expire old invites
    await supabase.rpc('expire_old_workspace_invites');

    // Get all invites for the workspace
    const { data: invites, error: invitesError } = await supabase
      .from('workspace_invites')
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        created_at,
        invited_by,
        users:invited_by (
          id,
          full_name,
          email
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (invitesError) {
      console.error('[ListInvites] Error fetching invites:', invitesError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invites: invites || [],
    });
  } catch (error) {
    console.error('[ListInvites] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
