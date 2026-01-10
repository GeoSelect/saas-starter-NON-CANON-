-- Migration: Workspace Invites
-- Created: 2026-01-10
-- Purpose: Add workspace invitation system for team member management

-- ============================================================================
-- TABLE: workspace_invites
-- ============================================================================
-- Purpose: Manage workspace invitations for new team members
-- Schema: Track pending, accepted, rejected, and expired invitations

CREATE TABLE IF NOT EXISTS workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Prevent duplicate pending invites for same email to same workspace
  UNIQUE(workspace_id, email, status)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS workspace_invites_workspace_idx ON workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_invites_email_idx ON workspace_invites(email);
CREATE INDEX IF NOT EXISTS workspace_invites_token_idx ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS workspace_invites_status_idx ON workspace_invites(status);
CREATE INDEX IF NOT EXISTS workspace_invites_invited_by_idx ON workspace_invites(invited_by);
CREATE INDEX IF NOT EXISTS workspace_invites_expires_idx ON workspace_invites(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Workspace Invites
-- ============================================================================

ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- Workspace members can view invites in their workspace
DROP POLICY IF EXISTS workspace_invites_select ON workspace_invites;
CREATE POLICY workspace_invites_select ON workspace_invites
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Only workspace admins/owners can create invites
DROP POLICY IF EXISTS workspace_invites_insert ON workspace_invites;
CREATE POLICY workspace_invites_insert ON workspace_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = NEW.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only workspace admins/owners can update invites (cancel)
DROP POLICY IF EXISTS workspace_invites_update ON workspace_invites;
CREATE POLICY workspace_invites_update ON workspace_invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_invites.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only workspace admins/owners can delete invites
DROP POLICY IF EXISTS workspace_invites_delete ON workspace_invites;
CREATE POLICY workspace_invites_delete ON workspace_invites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_invites.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_workspace_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspace_invites_updated_at ON workspace_invites;
CREATE TRIGGER workspace_invites_updated_at
  BEFORE UPDATE ON workspace_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_invites_updated_at();

-- ============================================================================
-- FUNCTION: Auto-expire old invites
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_workspace_invites()
RETURNS void AS $$
BEGIN
  UPDATE workspace_invites
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment: This function can be called periodically via a cron job or
-- checked at runtime when listing invites
