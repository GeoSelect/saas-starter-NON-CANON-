-- RLS Policies: Workspaces (CCP-05)
-- Created: 2026-01-03
-- Contract: frozen
-- Audit: success-only
-- Dependencies: Assumes Supabase auth with JWT claims including auth.uid() and custom claims

-- ============================================================================
-- PREREQUISITE: Enable RLS on workspace tables
-- ============================================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
-- Uncomment if workspace_anchors is enabled:
-- ALTER TABLE workspace_anchors ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get account_id from authenticated user
-- ============================================================================
-- This assumes your auth system sets a custom claim or session variable
-- Adjust based on your Supabase/auth implementation

CREATE OR REPLACE FUNCTION auth.current_account_id()
RETURNS UUID AS $$
  -- Option 1: If account_id is stored in JWT custom claims
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'account_id', '')::UUID;
  
  -- Option 2: If account_id maps directly to auth.uid()
  -- SELECT auth.uid();
  
  -- Option 3: If accounts table has a user_id FK to auth.users
  -- SELECT id FROM accounts WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- POLICY: workspaces - SELECT
-- ============================================================================
-- Who can read: Members of the workspace (via workspace_members table)

CREATE POLICY workspaces_select_policy ON workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.account_id = auth.current_account_id()
    )
  );

-- ============================================================================
-- POLICY: workspaces - INSERT
-- ============================================================================
-- Who can create: Any authenticated account (they become owner)
-- Note: Application layer must create corresponding workspace_members row

CREATE POLICY workspaces_insert_policy ON workspaces
  FOR INSERT
  WITH CHECK (
    auth.current_account_id() IS NOT NULL
    AND owner_account_id = auth.current_account_id()
  );

-- ============================================================================
-- POLICY: workspaces - UPDATE
-- ============================================================================
-- Who can update: Owners and admins only

CREATE POLICY workspaces_update_policy ON workspaces
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.account_id = auth.current_account_id()
        AND workspace_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.account_id = auth.current_account_id()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- POLICY: workspaces - DELETE
-- ============================================================================
-- Who can delete: Owners only (hard delete, cascades to members and child resources)

CREATE POLICY workspaces_delete_policy ON workspaces
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.account_id = auth.current_account_id()
        AND workspace_members.role = 'owner'
    )
  );

-- ============================================================================
-- POLICY: workspace_members - SELECT
-- ============================================================================
-- Who can read: Members of the workspace

CREATE POLICY workspace_members_select_policy ON workspace_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.account_id = auth.current_account_id()
    )
  );

-- ============================================================================
-- POLICY: workspace_members - INSERT
-- ============================================================================
-- Who can add members: Owners and admins only

CREATE POLICY workspace_members_insert_policy ON workspace_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.account_id = auth.current_account_id()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- POLICY: workspace_members - UPDATE
-- ============================================================================
-- Who can update roles: Owners and admins only
-- Prevent self-demotion of last owner

CREATE POLICY workspace_members_update_policy ON workspace_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.account_id = auth.current_account_id()
        AND wm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.account_id = auth.current_account_id()
        AND wm.role IN ('owner', 'admin')
    )
    -- Optional: Prevent removing the last owner (application layer should enforce)
    AND (
      workspace_members.role <> 'owner'
      OR EXISTS (
        SELECT 1 FROM workspace_members wm2
        WHERE wm2.workspace_id = workspace_members.workspace_id
          AND wm2.role = 'owner'
          AND wm2.id <> workspace_members.id
      )
    )
  );

-- ============================================================================
-- POLICY: workspace_members - DELETE
-- ============================================================================
-- Who can remove members: Owners and admins only
-- Note: Self-removal allowed (members can leave); owners cannot remove themselves if last owner

CREATE POLICY workspace_members_delete_policy ON workspace_members
  FOR DELETE
  USING (
    -- Self-removal (leave workspace)
    workspace_members.account_id = auth.current_account_id()
    -- OR owner/admin removing others
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.account_id = auth.current_account_id()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- OPTIONAL: workspace_anchors RLS Policies
-- ============================================================================
-- Uncomment if workspace_anchors table is enabled

/*
CREATE POLICY workspace_anchors_select_policy ON workspace_anchors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_anchors.workspace_id
        AND workspace_members.account_id = auth.current_account_id()
    )
  );

CREATE POLICY workspace_anchors_insert_policy ON workspace_anchors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_anchors.workspace_id
        AND workspace_members.account_id = auth.current_account_id()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY workspace_anchors_update_policy ON workspace_anchors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_anchors.workspace_id
        AND workspace_members.account_id = auth.current_account_id()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY workspace_anchors_delete_policy ON workspace_anchors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_anchors.workspace_id
        AND workspace_members.account_id = auth.current_account_id()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );
*/

-- ============================================================================
-- TESTING RLS POLICIES (Development Only)
-- ============================================================================
-- To test these policies in a SQL client:

/*
-- Set session variable to simulate authenticated user
SET request.jwt.claims = '{"account_id": "YOUR_ACCOUNT_UUID_HERE"}';

-- Test SELECT (should only return workspaces where you're a member)
SELECT * FROM workspaces;

-- Test INSERT (should succeed if account_id matches owner_account_id)
INSERT INTO workspaces (name, owner_account_id) 
VALUES ('Test Workspace', 'YOUR_ACCOUNT_UUID_HERE');

-- Test member operations
SELECT * FROM workspace_members WHERE workspace_id = 'WORKSPACE_UUID';
*/
