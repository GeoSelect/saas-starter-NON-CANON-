/**
 * Server-side authentication context resolver
 * 
 * Resolves user and workspace context from request with fallback hierarchy:
 * 1. Database primary mapping (source of truth)
 * 2. httpOnly cookie (active_workspace)
 * 3. Dev query param (?workspace) - development only
 * 
 * This ensures consistent workspace context across all server components.
 */

import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export interface AuthContextServerSide {
  user: {
    id: string;
    email: string;
    [key: string]: any;
  } | null;
  workspaceId: string | null;
  source?: 'database_primary' | 'cookie_active_workspace' | 'dev_query_param' | 'none';
}

/**
 * Resolve user from session (Supabase/Auth implementation)
 * This would be implemented based on your auth provider
 */
async function resolveUserFromSession(request: any): Promise<{ id: string; email: string } | null> {
  try {
    // TODO: Implement based on your auth provider (Supabase, Clerk, NextAuth, etc.)
    // Example for Supabase:
    // const { data: { session } } = await supabase.auth.getSession();
    // return session?.user ?? null;

    // Placeholder
    return null;
  } catch (err) {
    console.error('[AUTH] Failed to resolve user from session:', err);
    return null;
  }
}

/**
 * Find primary workspace mapping for user
 * Queries database for user's default/primary workspace
 */
async function findWorkspaceForUser(userId: string): Promise<{ id: string; name: string } | null> {
  try {
    // TODO: Implement database query
    // Example:
    // const workspace = await db.workspaces.findFirst({
    //   where: {
    //     OR: [
    //       { owner_id: userId },
    //       { users_workspaces: { some: { user_id: userId } } }
    //     ]
    //   },
    //   orderBy: { created_at: 'asc' }
    // });

    // Placeholder
    return null;
  } catch (err) {
    console.error('[AUTH] Failed to find workspace for user:', err);
    return null;
  }
}

/**
 * Validate that user is a member of the workspace
 * Checks users_workspaces table for membership before trusting
 */
async function validateWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    // TODO: Implement membership check
    // Example:
    // const membership = await db.usersWorkspaces.findUnique({
    //   where: {
    //     user_id_workspace_id: {
    //       user_id: userId,
    //       workspace_id: workspaceId
    //     }
    //   }
    // });
    // return !!membership;

    // Placeholder
    return false;
  } catch (err) {
    console.error('[AUTH] Failed to validate workspace membership:', err);
    return false;
  }
}

/**
 * Get active workspace from httpOnly cookie
 */
function getActiveWorkspaceFromCookie(request: any): string | null {
  try {
    const cookieHeader = request.headers?.get?.('cookie') || '';
    const match = cookieHeader.match(/active_workspace=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch (err) {
    console.error('[AUTH] Failed to read active_workspace cookie:', err);
    return null;
  }
}

/**
 * Get dev workspace override from query params (development only)
 */
function getDevWorkspaceOverride(request: any): string | null {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  try {
    const url = new URL(request.url || '');
    return url.searchParams.get('workspace');
  } catch (err) {
    console.error('[AUTH] Failed to read workspace query param:', err);
    return null;
  }
}

/**
 * Main function: Resolve auth context from server-side request
 * 
 * Returns user + workspace with source tracking for debugging
 */
export async function getAuthContextServerSide(
  request: any
): Promise<AuthContextServerSide> {
  // Step 0: Resolve user
  const user = await resolveUserFromSession(request);
  if (!user) {
    console.debug('[AUTH] No authenticated user found');
    return { user: null, workspaceId: null, source: 'none' };
  }

  let workspaceId: string | null = null;
  let source: AuthContextServerSide['source'] = 'none';

  // Step 1: Primary - Database lookup
  const dbMapping = await findWorkspaceForUser(user.id);
  if (dbMapping) {
    workspaceId = dbMapping.id;
    source = 'database_primary';
    console.debug(`[AUTH] User ${user.id} resolved via database primary: ${workspaceId}`);
    return { user, workspaceId, source };
  }

  // Step 2: Secondary - Check httpOnly cookie
  const cookieWorkspace = getActiveWorkspaceFromCookie(request);
  if (cookieWorkspace) {
    const isMember = await validateWorkspaceMembership(user.id, cookieWorkspace);
    if (isMember) {
      workspaceId = cookieWorkspace;
      source = 'cookie_active_workspace';
      console.debug(`[AUTH] User ${user.id} resolved via active_workspace cookie: ${workspaceId}`);
      return { user, workspaceId, source };
    } else {
      // Log security concern: user attempting to access unauthorized workspace
      console.warn(
        `[AUTH] Security: User ${user.id} has invalid active_workspace cookie: ${cookieWorkspace} (not a member)`
      );
    }
  }

  // Step 3: Tertiary - Dev override via query param
  const devWorkspace = getDevWorkspaceOverride(request);
  if (devWorkspace) {
    const isMember = await validateWorkspaceMembership(user.id, devWorkspace);
    if (isMember) {
      workspaceId = devWorkspace;
      source = 'dev_query_param';
      console.debug(`[AUTH] User ${user.id} resolved via dev query param: ${workspaceId}`);
      return { user, workspaceId, source };
    } else {
      console.warn(
        `[AUTH] Dev: User ${user.id} attempted to access unauthorized workspace via param: ${devWorkspace}`
      );
    }
  }

  // No workspace found
  console.warn(
    `[AUTH] User ${user.id} has no accessible workspace (no database mapping, invalid cookie, or dev param failed)`
  );
  return { user, workspaceId: null, source: 'none' };
}

/**
 * Convenience overload for Next.js request object
 */
export async function getAuthContextFromRequest(
  request: Request
): Promise<AuthContextServerSide> {
  return getAuthContextServerSide(request);
}

/**
 * Helper: Check if user owns workspace
 */
export async function isWorkspaceOwner(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    // TODO: Implement owner check
    // const workspace = await db.workspaces.findUnique({
    //   where: { id: workspaceId }
    // });
    // return workspace?.owner_id === userId;

    return false;
  } catch (err) {
    console.error('[AUTH] Failed to check workspace owner:', err);
    return false;
  }
}

/**
 * Helper: Get user's workspace role
 */
export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
  try {
    // TODO: Implement role fetch
    // const mapping = await db.usersWorkspaces.findUnique({
    //   where: {
    //     user_id_workspace_id: {
    //       user_id: userId,
    //       workspace_id: workspaceId
    //     }
    //   }
    // });
    // return mapping?.role ?? null;

    return null;
  } catch (err) {
    console.error('[AUTH] Failed to get user workspace role:', err);
    return null;
  }
}

/**
 * Helper: Guard that user has permission for workspace
 * Use in server components to enforce access control
 */
export async function requireWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<void> {
  const isMember = await validateWorkspaceMembership(userId, workspaceId);
  if (!isMember) {
    throw new Error(
      `Access denied: User ${userId} is not a member of workspace ${workspaceId}`
    );
  }
}

/**
 * Helper: Guard that user is workspace owner
 * Use in server components for admin-only operations
 */
export async function requireWorkspaceOwner(
  userId: string,
  workspaceId: string
): Promise<void> {
  const isOwner = await isWorkspaceOwner(userId, workspaceId);
  if (!isOwner) {
    throw new Error(`Access denied: User ${userId} is not the owner of workspace ${workspaceId}`);
  }
}

/**
 * Helper: Guard that user has specific role
 */
export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  requiredRole: 'owner' | 'admin' | 'member' | 'viewer'
): Promise<void> {
  const role = await getUserWorkspaceRole(userId, workspaceId);
  const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };

  const userLevel = roleHierarchy[role || 'viewer'];
  const requiredLevel = roleHierarchy[requiredRole];

  if (userLevel < requiredLevel) {
    throw new Error(
      `Access denied: User ${userId} has role '${role}' but requires '${requiredRole}' in workspace ${workspaceId}`
    );
  }
}
