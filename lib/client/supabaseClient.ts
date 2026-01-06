/**
 * Supabase Client-Side Anonymous Client
 *
 * SECURITY: This uses the NEXT_PUBLIC_SUPABASE_ANON_KEY (safe for client).
 *   - ✓ Uses anonymous key (no admin privileges)
 *   - ✓ Can be exposed in client code
 *   - ✓ Row-level security (RLS) policies enforce access control
 *
 * ⚠️  Never import or use SUPABASE_SERVICE_ROLE_KEY here.
 *    Use `lib/server/supabaseServer.ts` for server-side admin operations.
 *
 * Environment Variables (Public, safe):
 *   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Public key (limited privileges via RLS)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});
