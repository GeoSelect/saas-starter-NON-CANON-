/**
 * ============================================================================
 * Supabase Auth Helper - Supports both Cookies and Bearer JWT
 * ============================================================================
 * 
 * This helper allows routes to authenticate using either:
 * 1. Cookies (default, from browser/SSR)
 * 2. Authorization: Bearer <JWT> (for CLI, automated tests, external tools)
 * 
 * Usage in route handlers:
 * ```typescript
 * const { user, error } = await getAuthenticatedUser(request);
 * if (!user) return NextResponse.json({ error }, { status: 401 });
 * ```
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export interface AuthResult {
  user: { id: string } | null;
  error: string | null;
}

/**
 * Get authenticated user from request.
 * 
 * Tries authentication in order:
 * 1. Session cookies (Supabase SSR)
 * 2. Authorization: Bearer <JWT> header
 * 
 * @param request - NextRequest object
 * @returns { user, error }
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthResult> {
  try {
    // Try cookies first (preferred for browser/SSR)
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

    const { data: { user: cookieUser } } = await client.auth.getUser();

    if (cookieUser) {
      return { user: cookieUser, error: null };
    }

    // Fallback to Bearer token (for CLI, tests, external APIs)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "Unauthorized" };
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    // Verify token with Supabase
    const { data: { user: tokenUser }, error: tokenError } =
      await client.auth.getUser(token);

    if (tokenError || !tokenUser) {
      return { user: null, error: "Unauthorized" };
    }

    return { user: tokenUser, error: null };
  } catch (error) {
    console.error("Auth error:", error);
    return { user: null, error: "Unauthorized" };
  }
}

/**
 * Like getAuthenticatedUser but throws on error.
 * Useful for simplified route handlers.
 */
export async function requireAuth(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error(error || "Unauthorized");
  }
  return user;
}
