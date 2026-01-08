import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Components (layout/page/db queries):
 * cookie reads only, no writes.
 */
export async function supabaseRSC() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // no-op in Server Components (read-only context)
        }
      }
    }
  );
}

/**
 * Route Handlers (app/api/.../route.ts):
 * cookie reads + writes.
 */
export async function supabaseRoute() {
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
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // do not crash if Next blocks writes in some contexts
          }
        }
      }
    }
  );
}

/**
 * Server Actions (form actions, mutations):
 * cookie reads + writes with error handling.
 * Alias for supabaseRoute() - same implementation needed.
 */
export const supabaseAction = supabaseRoute;

/**
 * Alias for backward compatibility
 * @deprecated Use supabaseRoute() instead
 */
export const createClient = supabaseRoute;
