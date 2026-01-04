-- Migration: Create Branded Reports (CCP-06)
-- Created: 2026-01-03
-- Contract: frozen (v"rpt-0.1")
-- Audit: success-only
-- Parent: CCP-05 (Workspace Container)

-- ============================================================================
-- TABLE: reports_v1
-- ============================================================================
-- Purpose: Branded reports scoped to workspaces
-- Schema: Frozen v"rpt-0.1" (projection + branding)

CREATE TABLE IF NOT EXISTS reports_v1 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  projection JSONB NOT NULL, -- frozen {parcel_id, location, intent}
  branding JSONB DEFAULT '{}', -- {workspace_name, color_primary?, logo_url?}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT reports_workspace_fkey FOREIGN KEY (workspace_id)
    REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT reports_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT reports_workspace_name_unique UNIQUE (workspace_id, name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_workspace ON reports_v1(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports_v1(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports_v1(created_at DESC);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_reports_v1_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_v1_updated_at_trigger
  BEFORE UPDATE ON reports_v1
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_v1_updated_at();

-- ============================================================================
-- SEED DATA (optional, for development)
-- ============================================================================
-- Uncomment to seed a sample report for testing

/*
DO $$
DECLARE
  test_workspace_id UUID;
BEGIN
  -- Get first workspace (assumes CCP-05 seed was run)
  SELECT id INTO test_workspace_id FROM workspaces LIMIT 1;
  
  IF test_workspace_id IS NOT NULL THEN
    INSERT INTO reports_v1 (workspace_id, name, status, projection, branding)
    VALUES (
      test_workspace_id,
      'Sample Report',
      'draft',
      '{"parcel_id": "test-parcel-001", "location": {"lat": 39.7392, "lng": -105.0844}, "intent": "assessment"}'::jsonb,
      '{"workspace_name": "Test Workspace"}'::jsonb
    );
    
    RAISE NOTICE 'Created sample report in workspace %', test_workspace_id;
  END IF;
END $$;
*/
