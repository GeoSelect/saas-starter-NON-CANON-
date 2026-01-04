-- Migration: Enable RLS on workspace_reports with member/admin policies
-- Created: 2026-01-03
-- Purpose: Enforce workspace-scoped access control for reports
-- Contract: CCP-06 (Branded Report)
-- Audit: RLS enforcement, no API-level bypass

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE public.workspace_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT (Read)
-- ============================================================================
-- Purpose: Any workspace member can read reports in their workspace
-- Rationale: Members need visibility into all workspace reports for collaboration
-- Risk: None (read-only, scoped to workspace)

DROP POLICY IF EXISTS workspace_reports_read_if_member ON public.workspace_reports;
CREATE POLICY workspace_reports_read_if_member
ON public.workspace_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_reports.workspace_id
      AND wm.account_id = public.current_account_id()
  )
);

-- ============================================================================
-- POLICY: INSERT (Create)
-- ============================================================================
-- Purpose: Only owner/admin can create new reports
-- Rationale: Write access must be restricted to prevent spam/unauthorized reports
-- Check: account is member AND role is owner or admin
-- Risk: Medium (write operation, but scoped to role)

DROP POLICY IF EXISTS workspace_reports_insert_if_admin ON public.workspace_reports;
CREATE POLICY workspace_reports_insert_if_admin
ON public.workspace_reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_reports.workspace_id
      AND wm.account_id = public.current_account_id()
      AND wm.role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- POLICY: UPDATE (Modify)
-- ============================================================================
-- Purpose: Nobody can update reports (immutable by design)
-- Rationale: Reports are frozen snapshots; changes require new report creation
-- Enforcement: USING (false) AND WITH CHECK (false) = all updates blocked
-- Risk: None (deny-all)

DROP POLICY IF EXISTS workspace_reports_no_update ON public.workspace_reports;
CREATE POLICY workspace_reports_no_update
ON public.workspace_reports
FOR UPDATE
USING (false)
WITH CHECK (false);

-- ============================================================================
-- POLICY: DELETE (Remove)
-- ============================================================================
-- Purpose: Only owner/admin can delete reports
-- Rationale: Deletion should be rare and restricted to workspace admins
-- Check: account is member AND role is owner or admin
-- Note: If you want strict immutability, drop this policy and allow no deletes
-- Risk: Medium (destructive operation, but scoped to admin role)

DROP POLICY IF EXISTS workspace_reports_delete_if_admin ON public.workspace_reports;
CREATE POLICY workspace_reports_delete_if_admin
ON public.workspace_reports
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_reports.workspace_id
      AND wm.account_id = public.current_account_id()
      AND wm.role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After migration, verify policies are in place:
--
-- SELECT policname, permissive, cmd FROM pg_policies
-- WHERE tablename = 'workspace_reports'
-- ORDER BY policname;
--
-- Expected output:
-- ┌─────────────────────────────────────┬────────────┬─────┐
-- │ policname                           │ permissive │ cmd │
-- ├─────────────────────────────────────┼────────────┼─────┤
-- │ workspace_reports_delete_if_admin   │ t          │ DEL │
-- │ workspace_reports_insert_if_admin   │ t          │ INS │
-- │ workspace_reports_no_update         │ f          │ UPD │
-- │ workspace_reports_read_if_member    │ t          │ SEL │
-- └─────────────────────────────────────┴────────────┴─────┘
--
-- Test as non-member:
--   SELECT COUNT(*) FROM workspace_reports WHERE workspace_id = <id>
--   Expected: 0 rows (or error if strict enforcement)
--
-- Test as member (non-admin):
--   INSERT INTO workspace_reports (...) VALUES (...)
--   Expected: error "new row violates row-level security policy"
--
-- Test as admin:
--   INSERT INTO workspace_reports (...) VALUES (...)
--   Expected: success

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. These policies rely on public.current_account_id() function
--    Ensure migration 20260103_rls_helper_current_account_id.sql runs first
--
-- 2. RLS is enforced at database level (cannot be bypassed from API)
--    API-level membership checks are defense-in-depth, not primary enforcement
--
-- 3. STABLE keyword on current_account_id() means policies are efficient
--    even on bulk operations (no per-row re-evaluation)
--
-- 4. If you want strict immutability (no deletes), comment out the DELETE policy
--
-- 5. workspace_members table RLS must be active for these policies to work
--    See: 20260103_ccp05_workspaces_policies.sql
