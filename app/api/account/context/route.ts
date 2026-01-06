/**
 * CCP-00: Account Context Resolution
 *
 * GET /api/account/context
 *
 * Resolves the authenticated user's profile, workspace membership,
 * entitlements, preferences, and activity signals.
 *
 * Returns the canonical UserProfile shape for the front-end.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  AccountContextResponse,
  UserProfile,
  User,
  WorkspaceMembership,
  UserPreferences,
} from "@/lib/types/user";

export async function GET(request: Request): Promise<Response> {
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
      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "User is not authenticated",
          },
        } as AccountContextResponse,
        { status: 401 }
      );
    }

    // 3. Fetch user profile from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      return Response.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User profile not found",
          },
        } as AccountContextResponse,
        { status: 404 }
      );
    }

    const user = userData as User;

    // 4. Get workspace memberships (all active workspaces for this user)
    const { data: memberships, error: membershipError } = await supabase
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
        created_at,
        updated_at,
        workspaces:workspace_id (
          id,
          organization_name,
          organization_type,
          is_active
        )
      `
      )
      .eq("user_id", authUser.id)
      .eq("is_active", true);

    if (membershipError) {
      return Response.json(
        {
          success: false,
          error: {
            code: "MEMBERSHIP_FETCH_ERROR",
            message: "Failed to fetch workspace memberships",
          },
        } as AccountContextResponse,
        { status: 500 }
      );
    }

    // 5. Determine active workspace (default to first, or from query param)
    const url = new URL(request.url);
    const requestedWorkspaceId = url.searchParams.get("workspace_id");

    let activeMembership = memberships?.[0];

    if (requestedWorkspaceId && memberships) {
      const requested = memberships.find(
        (m) => m.workspace_id === requestedWorkspaceId
      );
      if (requested) {
        activeMembership = requested;
      }
    }

    if (!activeMembership) {
      return Response.json(
        {
          success: false,
          error: {
            code: "NO_WORKSPACE",
            message: "User has no active workspace memberships",
          },
        } as AccountContextResponse,
        { status: 403 }
      );
    }

    // 6. Fetch user preferences
    const { data: prefsData } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    const prefs = prefsData as UserPreferences | null;

    // 7. Fetch latest activity (for UI hints)
    const { data: activities } = await supabase
      .from("user_activity")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("workspace_id", activeMembership.workspace_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // 8. Build canonical UserProfile shape
    const lastParcelViewed = activities?.find(
      (a) => a.activity_type === "parcel_viewed"
    )?.resource_id;
    const lastReportCreated = activities?.find(
      (a) => a.activity_type === "report_created"
    )?.created_at;

    const workspace = (activeMembership as any).workspaces;

    const userProfile: UserProfile = {
      // Identity
      user_id: user.id,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,

      // Operator Role
      role: user.role as any,
      title: user.title,
      organization_name: workspace?.organization_name,

      // Workspace Context
      active_workspace_id: activeMembership.workspace_id,
      workspace_role: activeMembership.workspace_role as any,

      // Entitlements
      entitlements: {
        can_resolve_parcels: activeMembership.can_resolve_parcels,
        can_create_reports: activeMembership.can_create_reports,
        can_share_reports: activeMembership.can_share_reports,
        can_view_audit_log: activeMembership.can_view_audit_log,
        can_manage_contacts: activeMembership.can_manage_contacts,
      },

      // Operational Defaults
      preferences: {
        default_map_view: prefs?.default_map_view || "satellite",
        default_report_type: prefs?.default_report_type || "Parcel IQ HOA",
        show_sources_expanded: prefs?.show_sources_expanded || false,
        mobile_first: prefs?.mobile_first || false,
      },

      // Activity Signals
      activity: {
        last_login_at: user.last_login_at || new Date().toISOString(),
        last_parcel_viewed: lastParcelViewed,
        last_report_created_at: lastReportCreated,
      },

      // Status & Trust
      status: {
        is_active: user.is_active,
        is_verified: user.is_verified,
        requires_reauth: user.requires_reauth,
      },
    };

    // 9. Update last_login_at
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", authUser.id);

    return Response.json(
      {
        success: true,
        data: userProfile,
      } as AccountContextResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/account/context] Error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      } as AccountContextResponse,
      { status: 500 }
    );
  }
}
