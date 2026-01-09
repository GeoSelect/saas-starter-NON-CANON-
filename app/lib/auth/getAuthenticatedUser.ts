/**
 * ============================================================================
 * Authentication Helper - Supports Cookies and Bearer Tokens
 * ============================================================================
 * 
 * Provides unified auth that works with both:
 * 1. Supabase session cookies (production - browser auth)
 * 2. Bearer JWT tokens (testing - CLI/automation)
 * 
 * Tries cookies first (more secure in production), falls back to Bearer token.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

interface AuthResult {
  user: any;
  error?: string;
}

/**
 * Get authenticated user from request
 * 
 * Supports both:
 * - Cookie-based (Supabase session): cookies are auto-managed
 * - Bearer token: Authorization: Bearer <JWT>
 * 
 * @param request - NextRequest object
 * @returns { user, error } User object if authenticated, error message if not
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthResult> {
  try {
    // ========================================================================
    // PRIORITY 1: Try cookie-based auth (production, most secure)
    // ========================================================================
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

    const { data: { user: cookieUser }, error: cookieError } = 
      await client.auth.getUser();

    if (cookieUser) {
      return { user: cookieUser };
    }

    // ========================================================================
    // PRIORITY 2: Fall back to Bearer token (testing, automation)
    // ========================================================================
    const authHeader = request.headers.get("Authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7); // Remove "Bearer " prefix
      
      if (!token) {
        return { error: "Invalid Bearer token format" };
      }

      try {
        // Verify JWT and extract user info
        // Supabase JWTs are verifiable without additional calls
        const { data: { user: bearerUser }, error: bearerError } =
          await client.auth.getUser({ jwt: token });

        if (bearerError || !bearerUser) {
          return { error: "Invalid or expired token" };
        }

        return { user: bearerUser };
      } catch (tokenError) {
        return { error: "Token verification failed" };
      }
    }

    // ========================================================================
    // PRIORITY 3: No auth method found
    // ========================================================================
    return { error: "Missing authentication (cookies or Bearer token)" };
  } catch (error) {
    console.error("Authentication error:", error);
    return { error: "Authentication failed" };
  }
}

/**
 * Create a Supabase client that works with both auth methods
 * 
 * Uses the same auth-aware approach as getAuthenticatedUser
 */
export async function createAuthenticatedClient(
  request: NextRequest
) {
  const cookieStore = await cookies();
  
  return createServerClient(
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
}
