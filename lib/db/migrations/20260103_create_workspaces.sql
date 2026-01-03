-- Migration: Create Workspaces Container (CCP-05)
-- Created: 2026-01-03
-- Contract: frozen
-- Audit: success-only

-- ============================================================================
-- TABLE: workspaces
-- ============================================================================
-- Purpose: Core workspace entity; unit of collaboration, governance, sharing
-- Per workspace-doctrine.md: all durable objects are workspace-scoped

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_account_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workspaces_name_check CHECK (LENGTH(TRIM(name)) >= 1),
  CONSTRAINT workspaces_owner_account_fkey FOREIGN KEY (owner_account_id) 
    REFERENCES accounts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_account_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at DESC);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at_trigger
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_workspaces_updated_at();

-- ============================================================================
-- TABLE: workspace_members
-- ============================================================================
-- Purpose: Junction table for workspace membership with roles
-- Roles: owner (creator), admin (full control), member (read/contribute)

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  account_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workspace_members_role_check CHECK (role IN ('owner', 'admin', 'member')),
  CONSTRAINT workspace_members_workspace_fkey FOREIGN KEY (workspace_id)
    REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT workspace_members_account_fkey FOREIGN KEY (account_id)
    REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT workspace_members_unique_membership UNIQUE (workspace_id, account_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_account ON workspace_members(account_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON workspace_members(workspace_id, role);

-- ============================================================================
-- TABLE: workspace_anchors (OPTIONAL - commented for future use)
-- ============================================================================
-- Purpose: Flexible metadata attachment point for workspace-scoped resources
-- Use when you need to tag/link external refs to a workspace without foreign keys
-- Examples: external system IDs, feature flags, per-workspace config overrides

/*
CREATE TABLE IF NOT EXISTS workspace_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  anchor_type VARCHAR(100) NOT NULL, -- e.g., 'stripe_customer', 'feature_flag', 'external_ref'
  ref_id VARCHAR(255), -- external reference ID (nullable)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT workspace_anchors_workspace_fkey FOREIGN KEY (workspace_id)
    REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT workspace_anchors_unique_anchor UNIQUE (workspace_id, anchor_type, ref_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_anchors_workspace ON workspace_anchors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_anchors_type ON workspace_anchors(anchor_type);
*/

-- Instructions for enabling workspace_anchors:
-- 1. Uncomment the CREATE TABLE and indexes above
-- 2. Run migration: pnpm db:migrate
-- 3. Update RLS policies in ccp05_workspaces_policies.sql if needed
-- 4. Document anchor_type conventions in workspace-doctrine.md

-- ============================================================================
-- SEED DATA (optional, for development)
-- ============================================================================
-- Uncomment to seed a default workspace for test@test.com account

/*
DO $$
DECLARE
  test_account_id UUID;
  test_workspace_id UUID;
BEGIN
  -- Get the test account ID (assumes accounts table has test@test.com)
  SELECT id INTO test_account_id FROM accounts WHERE email = 'test@test.com' LIMIT 1;
  
  IF test_account_id IS NOT NULL THEN
    -- Create default workspace
    INSERT INTO workspaces (name, owner_account_id, metadata)
    VALUES ('My First Workspace', test_account_id, '{"description": "Default workspace for testing"}')
    RETURNING id INTO test_workspace_id;
    
    -- Add owner as member
    INSERT INTO workspace_members (workspace_id, account_id, role)
    VALUES (test_workspace_id, test_account_id, 'owner');
    
    RAISE NOTICE 'Created default workspace % for account %', test_workspace_id, test_account_id;
  END IF;
END $$;
*/
