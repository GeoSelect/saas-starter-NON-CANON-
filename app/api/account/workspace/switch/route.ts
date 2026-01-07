/**
 * CCP-00: Switch Workspace
 *
 * POST /api/account/workspace/switch
 *
 * Allows user to switch their active workspace context.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth/middleware";
import { UserProfile } from "@/lib/types/user";
import { accountContextCache } from "@/lib/hooks/useAccountContext";

export type SwitchWorkspaceRequest = {
  workspace_id: string;
};

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Check authentication
    const auth = await requireAuth(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    // Parse request body
    const body = (await request.json()) as SwitchWorkspaceRequest;

    if (!body.workspace_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "workspace_id is required",
          },
        },
        { status: 400 }
      );
    }

    // Create Supabase client
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

    // Verify user has membership in the requested workspace
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select(
        `
        id,
        workspace_id,
        workspace_role,
        can_resolve_parcels,
        can_create_reports,
        can_share_reports,
        can_view_audit_log,
        can_manage_contacts,
        is_active,
        workspaces:workspace_id (
          id,
          organization_name,
          organization_type,
          is_active
        )
      `
      )
      .eq("user_id", auth.userId)
      .eq("workspace_id", body.workspace_id)
      .eq("is_active", true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WORKSPACE_NOT_FOUND",
            message: "User is not a member of this workspace",
          },
        },
        { status: 404 }
      );
    }

    // Fetch user profile for the response
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", auth.userId)
      .single();

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", auth.userId)
      .single();

    const workspace = (membership as any).workspaces;

    const userProfile: UserProfile = {
      user_id: user.id,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      role: user.role,
      title: user.title,
      organization_name: workspace?.organization_name,
      active_workspace_id: membership.workspace_id,
      workspace_role: membership.workspace_role,
      entitlements: {
        can_resolve_parcels: membership.can_resolve_parcels,
        can_create_reports: membership.can_create_reports,
        can_share_reports: membership.can_share_reports,
        can_view_audit_log: membership.can_view_audit_log,
        can_manage_contacts: membership.can_manage_contacts,
      },
      preferences: {
        default_map_view: prefs?.default_map_view || "satellite",
        default_report_type: prefs?.default_report_type || "Parcel IQ HOA",
        show_sources_expanded: prefs?.show_sources_expanded || false,
        mobile_first: prefs?.mobile_first || false,
      },
      activity: {
        last_login_at: user.last_login_at || new Date().toISOString(),
      },
      status: {
        is_active: user.is_active,
        is_verified: user.is_verified,
        requires_reauth: user.requires_reauth,
      },
    };

    // Invalidate cache to force refetch
    accountContextCache.invalidate();

    return NextResponse.json(
      {
        success: true,
        data: userProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/account/workspace/switch] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
