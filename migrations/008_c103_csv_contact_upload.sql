-- C103 CSV Contact Upload — Database Schema Migration
-- Append-only audit tables + contact FK for upload tracking
-- CCP-09 (Contact Management) + CCP-07 (Audit Logging)

-- ============================================================================
-- 1. contacts table modifications (add upload_id FK)
-- ============================================================================
ALTER TABLE contacts ADD COLUMN upload_id UUID REFERENCES contact_uploads(id) ON DELETE SET NULL;
CREATE INDEX idx_contacts_upload_id ON contacts(upload_id);

-- ============================================================================
-- 2. contact_uploads table (append-only, immutable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  total_rows INTEGER NOT NULL,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (valid_rows + error_rows <= total_rows),
  CONSTRAINT non_negative_counts CHECK (valid_rows >= 0 AND error_rows >= 0 AND total_rows > 0)
);

-- Indexes for fast queries
CREATE INDEX idx_contact_uploads_workspace_id ON contact_uploads(workspace_id);
CREATE INDEX idx_contact_uploads_user_id ON contact_uploads(user_id);
CREATE INDEX idx_contact_uploads_created_at ON contact_uploads(created_at DESC);
CREATE INDEX idx_contact_uploads_workspace_created ON contact_uploads(workspace_id, created_at DESC);

-- ============================================================================
-- 3. contact_uploads_audit table (append-only audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_uploads_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  total_rows INTEGER NOT NULL,
  valid_rows INTEGER NOT NULL,
  error_rows INTEGER NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for audit queries
CREATE INDEX idx_contact_uploads_audit_workspace_id ON contact_uploads_audit(workspace_id);
CREATE INDEX idx_contact_uploads_audit_user_id ON contact_uploads_audit(user_id);
CREATE INDEX idx_contact_uploads_audit_created_at ON contact_uploads_audit(created_at DESC);

-- ============================================================================
-- 4. Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE contact_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_uploads_audit ENABLE ROW LEVEL SECURITY;

-- contact_uploads: users can only view uploads from their workspaces
CREATE POLICY contact_uploads_workspace_select ON contact_uploads
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contact_uploads_workspace_insert ON contact_uploads
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- contact_uploads_audit: users can only view audits from their workspaces
CREATE POLICY contact_uploads_audit_select ON contact_uploads_audit
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contact_uploads_audit_insert ON contact_uploads_audit
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. Utility Views
-- ============================================================================

-- View: Upload summary by workspace (useful for analytics)
CREATE OR REPLACE VIEW contact_uploads_summary AS
SELECT
  workspace_id,
  COUNT(*) as total_uploads,
  SUM(valid_rows) as total_imported,
  SUM(error_rows) as total_errors,
  AVG(valid_rows::FLOAT / NULLIF(total_rows, 0)) as avg_success_rate
FROM contact_uploads
WHERE status IN ('success', 'partial')
GROUP BY workspace_id;

-- View: Recent uploads (last 30 days)
CREATE OR REPLACE VIEW contact_uploads_recent AS
SELECT
  id,
  workspace_id,
  user_id,
  file_name,
  file_size,
  total_rows,
  valid_rows,
  error_rows,
  status,
  created_at,
  (valid_rows::FLOAT / NULLIF(total_rows, 0) * 100)::INT as success_rate_pct
FROM contact_uploads
WHERE created_at >= now() - INTERVAL '30 days'
ORDER BY created_at DESC;
