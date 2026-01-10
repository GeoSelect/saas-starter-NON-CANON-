/**
 * Workspaces API - Create and list workspaces
 * POST /api/workspaces - Create a new workspace
 * GET /api/workspaces - List user's workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { setActiveWorkspace } from '@/lib/workspace/active-workspace';

interface CreateWorkspaceRequest {
  name: string;
  slug?: string;
  organization_type?: 'hoa' | 'portfolio' | 'management_company';
  set_as_active?: boolean;
}

/**
 * POST /api/workspaces
 * Create a new workspace for the authenticated user
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse request body
    let body: CreateWorkspaceRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { name, slug, organization_type = 'hoa', set_as_active = true } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Workspace name is required', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // 2. Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    // 3. Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthenticated', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // 4. Generate slug if not provided
    const workspaceSlug = slug || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    // 5. Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        organization_name: name.trim(),
        organization_type,
        primary_contact_email: authUser.email,
        is_active: true,
        metadata: {
          slug: workspaceSlug,
        },
      })
      .select()
      .single();

    if (workspaceError || !workspace) {
      console.error('[POST /api/workspaces] Workspace creation error:', workspaceError);
      return NextResponse.json(
        { error: 'Failed to create workspace', code: 'WORKSPACE_CREATE_ERROR' },
        { status: 500 }
      );
    }

    // 6. Add user as owner with full permissions
    const { error: membershipError } = await supabase
      .from('workspace_memberships')
      .insert({
        user_id: authUser.id,
        workspace_id: workspace.id,
        workspace_role: 'owner',
        can_resolve_parcels: true,
        can_create_reports: true,
        can_share_reports: true,
        can_view_audit_log: true,
        can_manage_contacts: true,
        is_active: true,
      });

    if (membershipError) {
      console.error('[POST /api/workspaces] Membership creation error:', membershipError);
      // Try to clean up the workspace
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      return NextResponse.json(
        { error: 'Failed to create workspace membership', code: 'MEMBERSHIP_CREATE_ERROR' },
        { status: 500 }
      );
    }

    // 7. Set as active workspace if requested
    if (set_as_active) {
      await setActiveWorkspace(workspace.id, authUser.id);
    }

    // 8. Return created workspace
    return NextResponse.json(
      {
        success: true,
        workspace: {
          id: workspace.id,
          name: workspace.organization_name,
          slug: workspaceSlug,
          tier: 'free', // Default tier
          organization_type: workspace.organization_type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/workspaces] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspaces
 * List all workspaces the authenticated user is a member of
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    // 2. Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthenticated', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // 3. Get user's workspace memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('workspace_memberships')
      .select(`
        workspace_role,
        is_active,
        workspaces:workspace_id (
          id,
          organization_name,
          organization_type,
          is_active,
          created_at,
          metadata
        )
      `)
      .eq('user_id', authUser.id)
      .eq('is_active', true);

    if (membershipError) {
      console.error('[GET /api/workspaces] Error fetching memberships:', membershipError);
      return NextResponse.json(
        { error: 'Failed to fetch workspaces', code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    // 4. Format response
    const workspaces = (memberships || [])
      .filter((m: any) => m.workspaces?.is_active)
      .map((m: any) => ({
        id: m.workspaces.id,
        name: m.workspaces.organization_name,
        slug: m.workspaces.metadata?.slug || m.workspaces.id,
        tier: 'free', // Default tier
        organization_type: m.workspaces.organization_type,
        role: m.workspace_role,
        created_at: m.workspaces.created_at,
      }));

    return NextResponse.json(
      {
        success: true,
        workspaces,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/workspaces] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
