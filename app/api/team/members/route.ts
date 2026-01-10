/**
 * API Route: Manage Team Members
 * GET /api/team/members - List all members in a workspace
 * DELETE /api/team/members/[id] - Remove a member from workspace
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

    // Get all members of the workspace
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select(`
        id,
        role,
        created_at,
        user_id,
        users:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (membersError) {
      console.error('[ListMembers] Error fetching members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      members: members || [],
    });
  } catch (error) {
    console.error('[ListMembers] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
