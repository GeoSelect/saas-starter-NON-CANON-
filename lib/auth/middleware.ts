import { z } from 'zod';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, user);
  };
}

type ActionWithTeamFunction<T> = (
  formData: FormData,
  team: TeamDataWithMembers
) => Promise<T>;

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    const team = await getTeamForUser();
    if (!team) {
      throw new Error('Team not found');
    }

    return action(formData, team);
  };
}

/**
 * Entitlement check result for API routes
 */
export interface EntitlementCheckAuth {
  userId: string;
  workspaceId: string;
  allowed: boolean;
}

/**
 * Check if a user has a specific entitlement capability
 * Used in API routes to gate access to premium features
 * 
 * Note: This is a simplified implementation that checks authentication and workspace access.
 * For more sophisticated entitlement checks, use getEntitlementStatus() directly.
 * 
 * @param request - Next.js request object
 * @param capability - The capability to check (for future use, currently not enforced)
 * @returns Auth object if allowed, null if denied
 */
export async function requireEntitlement(
  request: NextRequest,
  capability: string
): Promise<EntitlementCheckAuth | null> {
  try {
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
              // In middleware
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Get workspace from request body or query params
    const body = await request.clone().json().catch(() => ({}));
    const workspaceId = body.workspace_id || request.nextUrl.searchParams.get('workspace_id');

    if (!workspaceId) {
      console.warn('[requireEntitlement] No workspace_id provided');
      return null;
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return null;
    }

    // Note: Capability-based entitlement checking should be implemented here
    // For now, this function provides basic auth + workspace verification
    // Specific entitlement checks (like CCP-10) should use getEntitlementStatus() directly
    return {
      userId: user.id,
      workspaceId,
      allowed: true,
    };
  } catch (error) {
    console.error('[requireEntitlement] Error:', error);
    return null;
  }
}

/**
 * Return a standardized forbidden response
 */
export function forbiddenResponse(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}
