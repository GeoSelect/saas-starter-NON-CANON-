import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface ActiveWorkspaceData {
  schema: "active-workspace-0.1";
  data: {
    user_id: string;
    workspace_id: string;
    updated_at: string;
  };
}

export interface ActiveWorkspaceResponse {
  ok: boolean;
  active?: ActiveWorkspaceData;
  error?: string;
  code?: string;
}

/**
 * Get the authenticated user's active workspace
 * Returns 401 if not authenticated
 * Returns 403 if user has no active workspace set (not a member of any workspace)
 */
export async function getActiveWorkspace(
  userId?: string
): Promise<ActiveWorkspaceResponse> {
  const cookieStore = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user if not provided
  if (!userId) {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) {
      return {
        ok: false,
        error: "Unauthenticated",
        code: "workspace_active_unauthenticated",
      };
    }
    userId = user.id;
  }

  // Query active workspace
  const { data, error } = await client
    .from("user_active_workspace")
    .select("user_id, workspace_id, updated_at")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No row found
      return {
        ok: false,
        error: "No active workspace",
        code: "workspace_active_forbidden",
      };
    }
    throw error;
  }

  return {
    ok: true,
    active: {
      schema: "active-workspace-0.1",
      data: {
        user_id: data.user_id,
        workspace_id: data.workspace_id,
        updated_at: data.updated_at,
      },
    },
  };
}

/**
 * Set the active workspace for the authenticated user
 * Returns 401 if not authenticated
 * Returns 400 if workspace_id is invalid
 * Returns 403 if user is not a member of the workspace
 */
export async function setActiveWorkspace(
  workspaceId: string,
  userId?: string
): Promise<ActiveWorkspaceResponse> {
  const cookieStore = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user if not provided
  if (!userId) {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) {
      return {
        ok: false,
        error: "Unauthenticated",
        code: "workspace_active_unauthenticated",
      };
    }
    userId = user.id;
  }

  // Validate workspace_id format (UUID v4)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(workspaceId)) {
    return {
      ok: false,
      error: "Invalid workspace_id format",
      code: "workspace_active_contract",
    };
  }

  // Try to upsert active workspace
  // RLS will enforce that user is a member of the workspace
  const { data, error } = await client
    .from("user_active_workspace")
    .upsert(
      {
        user_id: userId,
        workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("user_id, workspace_id, updated_at")
    .single();

  if (error) {
    // RLS policy violation (user not a member)
    if (error.code === "PGRST201" || error.message.includes("policy")) {
      return {
        ok: false,
        error: "User not a member of workspace",
        code: "workspace_active_forbidden",
      };
    }
    // Foreign key violation (workspace doesn't exist) - still return 403
    if (error.code === "23503") {
      return {
        ok: false,
        error: "Workspace not found or access denied",
        code: "workspace_active_forbidden",
      };
    }
    throw error;
  }

  return {
    ok: true,
    active: {
      schema: "active-workspace-0.1",
      data: {
        user_id: data.user_id,
        workspace_id: data.workspace_id,
        updated_at: data.updated_at,
      },
    },
  };
}
