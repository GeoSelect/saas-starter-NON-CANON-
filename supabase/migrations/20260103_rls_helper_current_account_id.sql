-- Migration: Add RLS Helper Function - current_account_id()
-- Created: 2026-01-03
-- Purpose: Stable function for retrieving the current user's account ID
-- Usage: Use in RLS policies instead of repeated joins to account_users
-- Example: WHERE workspace_members.account_id = current_account_id()
-- 
-- NOTE: This assumes one of the following table structures exists:
-- - public.accounts table with user_id column (links to auth.users)
-- - public.account_users table with user_id and account_id columns
-- 
-- Adjust the SELECT query below based on your actual table schema.

-- ============================================================================
-- FUNCTION: public.current_account_id()
-- ============================================================================
-- Purpose: Returns the account ID for the currently authenticated user
-- Returns: UUID of the account, NULL if no account found or user not authenticated
-- Stability: STABLE (deterministic within a transaction)
-- Language: SQL (efficient, no runtime overhead)
--
-- Details:
-- - Queries auth.uid() (Supabase auth) to find associated account
-- - Expects a junction table mapping auth users to workspace accounts
-- - Returns NULL if user is unauthenticated (safe for RLS default-deny)

CREATE OR REPLACE FUNCTION public.current_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  -- Default implementation: assumes 'accounts' table with 'user_id' column
  -- If your table is named differently, adjust the table and column names below
  SELECT id
  FROM public.accounts
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.current_account_id() TO authenticated;

-- ============================================================================
-- CONFIGURATION
-- ============================================================================
-- IMPORTANT: Update the function above if your table schema differs:
--
-- If you have a junction table 'account_users' instead of 'accounts':
--   SELECT au.account_id
--   FROM public.account_users au
--   WHERE au.user_id = auth.uid()
--   LIMIT 1;
--
-- If account_id is stored directly in a 'users' table:
--   SELECT id FROM public.users WHERE user_id = auth.uid() LIMIT 1;
--
-- Always ensure:
-- 1. The table exists in public schema
-- 2. The user_id column contains auth.uid() values
-- 3. The account_id column or id column is UUID type
-- 4. RLS is enabled on the source table
--
-- After configuring, verify with:
--   SELECT current_account_id();  -- Should return your account UUID
--
-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- This function is reusable across all RLS policies. Examples:
--
-- Example 1: User can read their own account
--   CREATE POLICY account_select_self ON accounts
--   FOR SELECT TO authenticated
--   USING (id = current_account_id());
--
-- Example 2: User can update their own workspace membership role
--   CREATE POLICY workspace_members_update_own ON workspace_members
--   FOR UPDATE TO authenticated
--   USING (account_id = current_account_id())
--   WITH CHECK (account_id = current_account_id());
--
-- Example 3: User can only read workspaces they're a member of
--   CREATE POLICY workspaces_select_member ON workspaces
--   FOR SELECT TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM workspace_members wm
--       WHERE wm.workspace_id = workspaces.id
--       AND wm.account_id = current_account_id()
--     )
--   );
--
-- Benefits:
-- - Consistent across all policies (single source of truth)
-- - Readable: "WHERE account_id = current_account_id()" is self-documenting
-- - Efficient: STABLE prevents re-evaluation per row (important in bulk ops)
-- - Type-safe: Returns UUID, matches account_id columns exactly
-- - Safe: Returns NULL for unauthenticated (RLS default-deny semantic)
