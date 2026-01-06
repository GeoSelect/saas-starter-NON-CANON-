/**
 * Server-side Authentication Context Resolver
 *
 * SECURITY:
 * ⚠️ Always use getAuthContextServerSide() for server-side auth checks
 * ⚠️ Never expose SERVICE_ROLE_KEY to client
 * ⚠️ Never trust workspace/user IDs from URL or client state
 * ✓ Use actual Supabase auth via createServerComponentClient
 * ✓ Always verify user is member of workspace before granting access
 * ✓ Return null/empty when not authenticated (no default DEV_TEST values)
 */

import { createServerClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabaseServer';

export interface AuthContext {
  user: User | null;
  workspaceId: string | null;
}

/**
 * Resolve user + workspace server-side using real Supabase auth.
 * 
 * This function:
 * 1. Gets the authenticated user from Supabase session (via cookies)
 * 2. Looks up a workspace the user is a member of
 * 3. Returns both user and workspaceId
 * 
 * Returns { user: null, workspaceId: null } if not authenticated or no workspace.
 * Calling code should handle this defensively (show login/select workspace UI).
 */
export async function getAuthContextServerSide(): Promise<AuthContext> {
  // ============================================================================
  // STEP 1: Get authenticated user from Supabase session
  // ============================================================================
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    console.error('[AUTH] supabase.auth.getUser error:', userErr);
    return { user: null, workspaceId: null };
  }

  if (!user) {
    console.debug('[AUTH] No authenticated user found');
    return { user: null, workspaceId: null };
  }

  console.debug(`[AUTH] User authenticated: ${user.id}`);

  // ============================================================================
  // STEP 2: Find a workspace the user is member of
  // ============================================================================
  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[AUTH] Workspace lookup failed for user ${user.id}:`, error);
    return { user, workspaceId: null };
  }

  const workspaceId = data?.workspace_id ?? null;

  if (!workspaceId) {
    console.debug(`[AUTH] User ${user.id} is not member of any workspace`);
  } else {
    console.debug(`[AUTH] User ${user.id} resolved to workspace ${workspaceId}`);
  }

  return { user, workspaceId };
}