/**
 * Supabase Server Client (Admin)
 *
 * SECURITY: This file MUST ONLY be used on the server.
 * ⚠️ CRITICAL: Never expose the SERVICE_ROLE_KEY to the client.
 * ⚠️ Never import this in client components or send its client to the browser.
 *
 * Usage:
 * - Server Components: Can import and use directly
 * - API Routes: Can import and use directly
 * - Client Components: Use lib/client/supabaseClient.ts instead
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (server-only, never expose to client)');
}

/**
 * Admin Supabase client with SERVICE_ROLE_KEY
 * Has full database access and can bypass RLS policies
 *
 * SECURITY WARNING:
 * - Never instantiate this in client components
 * - Never send this client to the browser
 * - Only use in server-side code (server components, API routes, etc.)
 * - SERVICE_ROLE_KEY is sensitive and must remain private
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);