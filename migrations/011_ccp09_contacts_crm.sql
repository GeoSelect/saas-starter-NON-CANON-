-- CCP-09: Contact Management & CRM (Pro Plus tier)
-- Migration: Contacts, uploads audit, email tracking
-- Migration number: 011

-- ============================================================================
-- 1. contacts table (CRM contacts with Pro Plus tier)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  notes TEXT,
  tags TEXT[], -- Array of tags for filtering
  metadata JSONB DEFAULT '{}', -- Flexible metadata storage
  
  -- Email tracking
  email_sent_count INTEGER DEFAULT 0,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(workspace_id, email), -- One email per workspace
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_by ON contacts(created_by);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_workspace_email ON contacts(workspace_id, email);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags); -- GIN index for array searching

-- Auto-update updated_at
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. contact_uploads table (append-only audit trail for CSV uploads)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Upload metadata
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  row_count INTEGER NOT NULL, -- Total rows in CSV
  success_count INTEGER NOT NULL DEFAULT 0, -- Successfully imported
  error_count INTEGER NOT NULL DEFAULT 0, -- Failed rows
  duplicate_count INTEGER NOT NULL DEFAULT 0, -- Skipped duplicates
  
  -- Validation errors
  validation_errors JSONB DEFAULT '[]', -- Array of error objects
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contact_uploads_workspace_id ON contact_uploads(workspace_id);
CREATE INDEX idx_contact_uploads_uploaded_by ON contact_uploads(uploaded_by);
CREATE INDEX idx_contact_uploads_status ON contact_uploads(status);
CREATE INDEX idx_contact_uploads_created_at ON contact_uploads(created_at DESC);
CREATE INDEX idx_contact_uploads_workspace_created ON contact_uploads(workspace_id, created_at DESC);

-- ============================================================================
-- 3. contact_emails table (email send tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Email details
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Gmail API tracking
  gmail_message_id TEXT, -- Gmail API message ID
  gmail_thread_id TEXT, -- Gmail thread ID
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contact_emails_workspace_id ON contact_emails(workspace_id);
CREATE INDEX idx_contact_emails_contact_id ON contact_emails(contact_id);
CREATE INDEX idx_contact_emails_sent_by ON contact_emails(sent_by);
CREATE INDEX idx_contact_emails_status ON contact_emails(status);
CREATE INDEX idx_contact_emails_created_at ON contact_emails(created_at DESC);
CREATE INDEX idx_contact_emails_gmail_message_id ON contact_emails(gmail_message_id);

-- ============================================================================
-- 4. Row-Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_emails ENABLE ROW LEVEL SECURITY;

-- contacts: Users can only access contacts from their workspace
CREATE POLICY contacts_select ON contacts
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contacts_insert ON contacts
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contacts_update ON contacts
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contacts_delete ON contacts
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- contact_uploads: Users can view uploads from their workspace
CREATE POLICY contact_uploads_select ON contact_uploads
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contact_uploads_insert ON contact_uploads
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- contact_emails: Users can access emails from their workspace
CREATE POLICY contact_emails_select ON contact_emails
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contact_emails_insert ON contact_emails
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to update contact email stats
CREATE OR REPLACE FUNCTION update_contact_email_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sent' THEN
    UPDATE contacts
    SET
      email_sent_count = email_sent_count + 1,
      last_email_sent_at = NEW.sent_at,
      updated_at = now()
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update contact stats when email sent
CREATE TRIGGER contact_emails_update_stats
  AFTER INSERT OR UPDATE ON contact_emails
  FOR EACH ROW
  WHEN (NEW.status = 'sent')
  EXECUTE FUNCTION update_contact_email_stats();

-- ============================================================================
-- 6. Utility Views
-- ============================================================================

-- View: Contact upload summary (last 30 days)
CREATE OR REPLACE VIEW contact_upload_summary AS
SELECT
  workspace_id,
  COUNT(*) as total_uploads,
  SUM(row_count) as total_rows_processed,
  SUM(success_count) as total_success,
  SUM(error_count) as total_errors,
  SUM(duplicate_count) as total_duplicates,
  MAX(created_at) as last_upload_at
FROM contact_uploads
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY workspace_id;

-- View: Contact email stats per workspace
CREATE OR REPLACE VIEW contact_email_stats AS
SELECT
  c.workspace_id,
  c.id as contact_id,
  c.email,
  c.name,
  COUNT(ce.id) as total_emails_sent,
  MAX(ce.sent_at) as last_email_sent,
  SUM(CASE WHEN ce.status = 'sent' THEN 1 ELSE 0 END) as successful_sends,
  SUM(CASE WHEN ce.status = 'failed' THEN 1 ELSE 0 END) as failed_sends
FROM contacts c
LEFT JOIN contact_emails ce ON ce.contact_id = c.id
GROUP BY c.workspace_id, c.id, c.email, c.name;

-- ============================================================================
-- 7. Tier Limits Check Function
-- ============================================================================

-- Function to check if workspace can import contacts (tier-based)
CREATE OR REPLACE FUNCTION can_import_contacts(
  p_workspace_id UUID,
  p_row_count INTEGER
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  current_count INTEGER,
  tier_limit INTEGER
) AS $$
DECLARE
  v_tier TEXT;
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get workspace tier
  SELECT subscription_tier INTO v_tier
  FROM workspaces
  WHERE id = p_workspace_id;

  -- Get current contact count
  SELECT COUNT(*) INTO v_current_count
  FROM contacts
  WHERE workspace_id = p_workspace_id;

  -- Determine tier limit
  v_limit := CASE v_tier
    WHEN 'free' THEN 100
    WHEN 'pro' THEN 1000
    WHEN 'pro_plus' THEN 5000
    WHEN 'portfolio' THEN 20000
    WHEN 'enterprise' THEN 50000
    ELSE 100
  END;

  -- Check if import would exceed limit
  IF (v_current_count + p_row_count) > v_limit THEN
    RETURN QUERY SELECT
      FALSE,
      'Contact limit exceeded for tier: ' || v_tier,
      v_current_count,
      v_limit;
  ELSE
    RETURN QUERY SELECT
      TRUE,
      'Import allowed',
      v_current_count,
      v_limit;
  END IF;
END;
$$ LANGUAGE plpgsql;
