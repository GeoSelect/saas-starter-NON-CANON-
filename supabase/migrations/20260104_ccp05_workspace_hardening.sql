-- Migration: CCP-05 Workspace Hardening (Membership, Entitlements, Sharing)
-- Created: 2026-01-04
-- Purpose: Add membership verification, entitlements enforcement, secure sharing

-- ============================================================================
-- TABLE: workspace_members
-- ============================================================================
-- Purpose: Membership records for workspace access control
-- Schema: User → Workspace with role-based permissions

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(workspace_id, user_id) -- One membership per workspace per user
);

CREATE INDEX IF NOT EXISTS workspace_members_workspace_idx ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_members_user_idx ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS workspace_members_role_idx ON workspace_members(role);

-- ============================================================================
-- TABLE: workspace_entitlements
-- ============================================================================
-- Purpose: Feature limits and quota enforcement per workspace
-- Schema: Plan tier determines features/limits/storage

CREATE TABLE IF NOT EXISTS workspace_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE,
  plan_tier VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
  
  -- Features (JSON for flexibility)
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "max_reports": 5,
  --   "max_snapshots_per_report": 1,
  --   "max_collaborators": 1,
  --   "custom_branding": false,
  --   "api_access": false,
  --   "integrations": [],
  --   "sso": false
  -- }
  
  -- Limits (JSON for flexibility)
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "storage_gb": 1,
  --   "api_calls_per_month": 0,
  --   "custom_domains": 0
  -- }
  
  -- Plan-specific overrides (highest priority)
  overrides JSONB DEFAULT '{}'::jsonb,
  
  -- Validity
  active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_until TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS workspace_entitlements_workspace_idx ON workspace_entitlements(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_entitlements_plan_idx ON workspace_entitlements(plan_tier);
CREATE INDEX IF NOT EXISTS workspace_entitlements_status_idx ON workspace_entitlements(status);

-- ============================================================================
-- TABLE: report_share_tokens
-- ============================================================================
-- Purpose: Secure share links with token-based access + metadata
-- Schema: One-time tokens with expiry, rate limits, domain restrictions

CREATE TABLE IF NOT EXISTS report_share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  created_by_user_id UUID NOT NULL,
  
  -- Token (32-byte hex = 64 chars)
  token VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(255),
  
  -- Expiry
  expires_at TIMESTAMPTZ,
  
  -- Access level
  access_level VARCHAR(50) NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'comment', 'edit')),
  
  -- Optional password protection
  password_protected BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  
  -- Domain restrictions (JSON array)
  allowed_domains JSONB DEFAULT NULL,  -- null = any domain
  
  -- Rate limiting (views per hour)
  rate_limit INTEGER DEFAULT NULL,  -- null = unlimited
  
  -- Tracking
  tracking_enabled BOOLEAN DEFAULT TRUE,
  
  -- Revocation
  revoked_at TIMESTAMPTZ,
  
  -- Access statistics
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS report_share_tokens_token_idx ON report_share_tokens(token);
CREATE INDEX IF NOT EXISTS report_share_tokens_report_idx ON report_share_tokens(report_id);
CREATE INDEX IF NOT EXISTS report_share_tokens_workspace_idx ON report_share_tokens(workspace_id);
CREATE INDEX IF NOT EXISTS report_share_tokens_created_by_idx ON report_share_tokens(created_by_user_id);
CREATE INDEX IF NOT EXISTS report_share_tokens_expires_idx ON report_share_tokens(expires_at);
CREATE INDEX IF NOT EXISTS report_share_tokens_revoked_idx ON report_share_tokens(revoked_at);

-- ============================================================================
-- TABLE: share_token_access_logs
-- ============================================================================
-- Purpose: Audit trail of share token access for security & analytics
-- Schema: Track every access attempt with context

CREATE TABLE IF NOT EXISTS share_token_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL,
  report_id UUID NOT NULL,
  
  -- Request context
  ip_address INET,
  user_agent VARCHAR(500),
  referer VARCHAR(500),
  
  -- Result
  access_granted BOOLEAN,
  reason VARCHAR(100),  -- 'success', 'rate_limit', 'expired', 'invalid_password', etc.
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (token_id) REFERENCES report_share_tokens(id) ON DELETE CASCADE,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS share_token_access_logs_token_idx ON share_token_access_logs(token_id);
CREATE INDEX IF NOT EXISTS share_token_access_logs_report_idx ON share_token_access_logs(report_id);
CREATE INDEX IF NOT EXISTS share_token_access_logs_created_idx ON share_token_access_logs(created_at);
CREATE INDEX IF NOT EXISTS share_token_access_logs_granted_idx ON share_token_access_logs(access_granted);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Membership
-- ============================================================================

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace members can view other members in their workspace
DROP POLICY IF EXISTS workspace_members_select ON workspace_members;
CREATE POLICY workspace_members_select ON workspace_members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Only workspace admins/owners can add members
DROP POLICY IF EXISTS workspace_members_insert ON workspace_members;
CREATE POLICY workspace_members_insert ON workspace_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = NEW.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only workspace admins/owners can update members
DROP POLICY IF EXISTS workspace_members_update ON workspace_members;
CREATE POLICY workspace_members_update ON workspace_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_members.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only workspace owners can delete members
DROP POLICY IF EXISTS workspace_members_delete ON workspace_members;
CREATE POLICY workspace_members_delete ON workspace_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_members.workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Entitlements
-- ============================================================================

ALTER TABLE workspace_entitlements ENABLE ROW LEVEL SECURITY;

-- Workspace members can read entitlements for their workspace
DROP POLICY IF EXISTS workspace_entitlements_select ON workspace_entitlements;
CREATE POLICY workspace_entitlements_select ON workspace_entitlements
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Only workspace owners can update entitlements
DROP POLICY IF EXISTS workspace_entitlements_update ON workspace_entitlements;
CREATE POLICY workspace_entitlements_update ON workspace_entitlements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_entitlements.workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Share Tokens
-- ============================================================================

ALTER TABLE report_share_tokens ENABLE ROW LEVEL SECURITY;

-- Workspace members can view share tokens for their workspace
DROP POLICY IF EXISTS share_tokens_select ON report_share_tokens;
CREATE POLICY share_tokens_select ON report_share_tokens
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Workspace members can create share tokens for reports in their workspace
DROP POLICY IF EXISTS share_tokens_insert ON report_share_tokens;
CREATE POLICY share_tokens_insert ON report_share_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = NEW.workspace_id
      AND user_id = auth.uid()
    )
  );

-- Only creator or admins can update share tokens
DROP POLICY IF EXISTS share_tokens_update ON report_share_tokens;
CREATE POLICY share_tokens_update ON report_share_tokens
  FOR UPDATE
  USING (
    created_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = report_share_tokens.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only creator or admins can revoke share tokens
DROP POLICY IF EXISTS share_tokens_delete ON report_share_tokens;
CREATE POLICY share_tokens_delete ON report_share_tokens
  FOR DELETE
  USING (
    created_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = report_share_tokens.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Share Access Logs
-- ============================================================================

ALTER TABLE share_token_access_logs ENABLE ROW LEVEL SECURITY;

-- Workspace members can view access logs for their workspace
DROP POLICY IF EXISTS share_access_logs_select ON share_token_access_logs;
CREATE POLICY share_access_logs_select ON share_token_access_logs
  FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM reports
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- No direct inserts via RLS (logged via function)
ALTER TABLE share_token_access_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DEFAULT ENTITLEMENTS (Seed)
-- ============================================================================

-- Insert default free plan (run once per workspace creation)
-- This is handled in application code: lib/workspace/create-workspace.ts

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function: Auto-update updated_at on workspace_members
CREATE OR REPLACE FUNCTION update_workspace_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspace_members_updated_at ON workspace_members;
CREATE TRIGGER workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_members_updated_at();

-- Function: Auto-update updated_at on workspace_entitlements
CREATE OR REPLACE FUNCTION update_workspace_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspace_entitlements_updated_at ON workspace_entitlements;
CREATE TRIGGER workspace_entitlements_updated_at
  BEFORE UPDATE ON workspace_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_entitlements_updated_at();

-- Function: Auto-update updated_at on report_share_tokens
CREATE OR REPLACE FUNCTION update_report_share_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS report_share_tokens_updated_at ON report_share_tokens;
CREATE TRIGGER report_share_tokens_updated_at
  BEFORE UPDATE ON report_share_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_report_share_tokens_updated_at();

-- Function: Log share token access attempts
CREATE OR REPLACE FUNCTION log_share_token_access(
  token_id UUID,
  report_id UUID,
  ip_address INET,
  user_agent VARCHAR,
  referer VARCHAR,
  access_granted BOOLEAN,
  reason VARCHAR
)
RETURNS void AS $$
BEGIN
  INSERT INTO share_token_access_logs(
    token_id, report_id, ip_address, user_agent, referer,
    access_granted, reason
  ) VALUES (token_id, report_id, ip_address, user_agent, referer, access_granted, reason);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE workspace_members IS 'CCP-05: User membership in workspaces with role-based access control';
COMMENT ON TABLE workspace_entitlements IS 'CCP-05: Feature limits and quota enforcement per workspace/plan';
COMMENT ON TABLE report_share_tokens IS 'CCP-05: Secure share links with token-based access + metadata';
COMMENT ON TABLE share_token_access_logs IS 'CCP-05: Audit trail of share token access for security & analytics';

COMMENT ON COLUMN workspace_members.role IS 'Role hierarchy: owner > admin > member';
COMMENT ON COLUMN workspace_entitlements.plan_tier IS 'Plan tiers determine available features/limits';
COMMENT ON COLUMN report_share_tokens.token IS 'Cryptographic token (32-byte hex) for secure sharing';
COMMENT ON COLUMN report_share_tokens.access_level IS 'Permission level for shared access: view | comment | edit';
