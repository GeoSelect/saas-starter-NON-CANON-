-- Migration: 010_ccp10_share_links.sql
-- CCP-10: Report Sharing - Share Links Data Model
-- Created: 2026-01-08
-- Description: Secure, time-limited access to reports with comprehensive audit trails

-- ============================================================================
-- TABLE: share_links
-- ============================================================================
-- Purpose: Generate secure, shareable links to report snapshots
-- Security: Workspace-scoped with RLS policies
-- Features: Time-limited, usage tracking, optional authentication, revocable

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link identity
  token TEXT NOT NULL UNIQUE, -- Cryptographically secure token (e.g., base64url, 32+ chars)
  short_code TEXT UNIQUE, -- Optional short code (e.g., "abc123" for friendly URLs)
  
  -- Associations
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  snapshot_id UUID REFERENCES report_snapshots(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Recipient (optional - for targeted sharing)
  recipient_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  recipient_email TEXT,
  
  -- Access control
  access_role TEXT CHECK (access_role IN ('viewer', 'commenter', 'editor')) DEFAULT 'viewer',
  requires_auth BOOLEAN DEFAULT false, -- If true, recipient must authenticate
  
  -- Expiration & revocation
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  
  -- Usage tracking
  view_count INT DEFAULT 0,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  max_views INT, -- Optional limit (NULL = unlimited)
  
  -- Metadata (extensible JSON for future features)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: share_link_events
-- ============================================================================
-- Purpose: Append-only audit trail for all share link interactions
-- Security: Immutable audit log with actor tracking
-- Features: IP logging, user agent tracking, event types

CREATE TABLE IF NOT EXISTS share_link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE NOT NULL,
  
  -- Event classification
  event_type TEXT CHECK (event_type IN (
    'created',        -- Link was created
    'viewed',         -- Report was viewed via link
    'downloaded',     -- Report was downloaded via link
    'revoked',        -- Link was manually revoked
    'expired',        -- Link expired naturally
    'access_denied'   -- Access attempt was blocked
  )) NOT NULL,
  
  -- Actor tracking
  actor_user_id UUID REFERENCES auth.users(id), -- NULL if anonymous access
  actor_ip_address INET,
  actor_user_agent TEXT,
  
  -- Extensible metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES: Performance optimization
-- ============================================================================

-- Fast token lookup (primary access pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_token 
  ON share_links(token);

-- Fast short code lookup (friendly URLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_short_code 
  ON share_links(short_code) 
  WHERE short_code IS NOT NULL;

-- Workspace queries (list all links for workspace)
CREATE INDEX IF NOT EXISTS idx_share_links_workspace_id 
  ON share_links(workspace_id);

-- Snapshot queries (find links for specific report)
CREATE INDEX IF NOT EXISTS idx_share_links_snapshot_id 
  ON share_links(snapshot_id);

-- Creator queries (find links created by user)
CREATE INDEX IF NOT EXISTS idx_share_links_created_by 
  ON share_links(created_by);

-- Expiration checks (find expired/expiring links)
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at 
  ON share_links(expires_at) 
  WHERE revoked_at IS NULL;

-- Active link queries (non-revoked, non-expired)
CREATE INDEX IF NOT EXISTS idx_share_links_active 
  ON share_links(workspace_id, expires_at) 
  WHERE revoked_at IS NULL;

-- Event queries (audit trail for specific link)
CREATE INDEX IF NOT EXISTS idx_share_link_events_link_id 
  ON share_link_events(share_link_id, created_at DESC);

-- Event type filtering (e.g., all access_denied events)
CREATE INDEX IF NOT EXISTS idx_share_link_events_type 
  ON share_link_events(event_type, created_at DESC);

-- Actor tracking (find all events by user)
CREATE INDEX IF NOT EXISTS idx_share_link_events_actor 
  ON share_link_events(actor_user_id, created_at DESC) 
  WHERE actor_user_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICY: share_links - SELECT (Read)
-- ============================================================================
-- Workspace members can view links in their workspace
-- Link owners can always view their own links
-- Anonymous users can read via token (validated in application logic)

CREATE POLICY share_links_select ON share_links
  FOR SELECT
  USING (
    -- Workspace member can see all workspace links
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
    OR
    -- Creator can always see their own links
    created_by = auth.uid()
  );

-- ============================================================================
-- RLS POLICY: share_links - INSERT (Create)
-- ============================================================================
-- Only workspace members can create share links

CREATE POLICY share_links_insert ON share_links
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- ============================================================================
-- RLS POLICY: share_links - UPDATE (Revoke, track views)
-- ============================================================================
-- Workspace members can revoke links
-- System can update view counts (via service role)

CREATE POLICY share_links_update ON share_links
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICY: share_links - DELETE
-- ============================================================================
-- Only workspace owners/admins can delete share links
-- (Most apps prefer soft-delete via revocation)

CREATE POLICY share_links_delete ON share_links
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICY: share_link_events - SELECT (Read audit logs)
-- ============================================================================
-- Workspace members can view audit events for their workspace's links

CREATE POLICY share_link_events_select ON share_link_events
  FOR SELECT
  USING (
    share_link_id IN (
      SELECT id 
      FROM share_links 
      WHERE workspace_id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- RLS POLICY: share_link_events - INSERT (Append-only audit)
-- ============================================================================
-- Service role can insert events
-- Application logic handles event creation (not end users directly)

CREATE POLICY share_link_events_insert ON share_link_events
  FOR INSERT
  WITH CHECK (true); -- Service role enforces this

-- ============================================================================
-- RLS POLICY: share_link_events - UPDATE/DELETE DISABLED
-- ============================================================================
-- Audit events are immutable (append-only log)

-- No UPDATE policy = immutable events
-- No DELETE policy = permanent audit trail

-- ============================================================================
-- TRIGGERS: Automatic timestamp management
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER share_links_updated_at
  BEFORE UPDATE ON share_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Check if link is valid
-- ============================================================================
-- Centralized validation logic for use in queries

CREATE OR REPLACE FUNCTION is_share_link_valid(link_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  link RECORD;
BEGIN
  SELECT * INTO link FROM share_links WHERE id = link_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if revoked
  IF link.revoked_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if expired
  IF link.expires_at < now() THEN
    RETURN FALSE;
  END IF;
  
  -- Check if max views exceeded
  IF link.max_views IS NOT NULL AND link.view_count >= link.max_views THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS: Documentation for schema
-- ============================================================================

COMMENT ON TABLE share_links IS 'CCP-10: Secure, time-limited share links for report snapshots';
COMMENT ON TABLE share_link_events IS 'CCP-10: Immutable audit trail for share link interactions';
COMMENT ON COLUMN share_links.token IS 'Cryptographically secure token (32+ chars, base64url)';
COMMENT ON COLUMN share_links.short_code IS 'Optional friendly short code for URLs (e.g., abc123)';
COMMENT ON COLUMN share_links.requires_auth IS 'If true, recipient must authenticate before viewing';
COMMENT ON COLUMN share_links.max_views IS 'Optional view limit (NULL = unlimited)';
COMMENT ON FUNCTION is_share_link_valid IS 'Check if share link is valid (not revoked, expired, or over limit)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Create lib/db/helpers/share-links.ts (CRUD operations)
-- 2. Create app/api/share-links/route.ts (POST to create link)
-- 3. Create app/api/share-links/[token]/route.ts (GET to validate/use link)
-- 4. Create app/shared/[token]/page.tsx (public view page)
-- 5. Add share button to report UI
-- ============================================================================
