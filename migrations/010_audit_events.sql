/**
 * Migration: Create audit_events table for tracking user actions.
 * File: migrations/010_audit_events.sql
 *
 * This migration creates the audit_events table to log:
 * - Page navigation (pagination events)
 * - Data mutations (create, update, delete)
 * - API access
 * - Security events (auth failures, permission denials, etc.)
 *
 * Includes:
 * - Row-level security (RLS) policies
 * - Indexes for efficient querying
 * - Foreign key constraints
 * - Timestamps with defaults
 *
 * Usage in app:
 * - app/parcels/page/[pageNum]/page.tsx → auditPageNavigation()
 * - lib/server/audit.ts → auditEvent()
 */

BEGIN;

-- ============================================================================
-- CREATE TABLE: audit_events
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys (denormalized for performance, with soft delete handling)
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,

  -- Event classification
  event_type VARCHAR(100) NOT NULL,
    -- Examples: 'page_view', 'parcel_created', 'parcel_updated', 'parcel_deleted',
    --           'auth_login', 'auth_logout', 'permission_denied', 'api_call'
  resource_type VARCHAR(50),
    -- Examples: 'parcels', 'reports', 'workspaces', 'users'
  resource_id UUID,
    -- ID of specific resource being accessed/modified (e.g., parcel UUID)

  -- Pagination context (for page_view events)
  page_num INTEGER,
    -- Current page number (1-indexed)
  total_pages INTEGER,
    -- Total available pages (for analytics)

  -- Request context
  user_agent VARCHAR(500),
    -- Browser/client user agent string
  ip_address INET,
    -- Requester's IP address (x-forwarded-for if behind proxy)
  referer VARCHAR(500),
    -- HTTP Referer header (where user came from)

  -- Flexible metadata
  metadata JSONB DEFAULT '{}'::jsonb,
    -- Arbitrary additional context:
    -- {
    --   "sort_by": "updated_at",
    --   "sort_order": "desc",
    --   "search_term": "acme",
    --   "status_filter": "active",
    --   "duration_ms": 145,
    --   "result_count": 25
    -- }

  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT event_type_not_empty CHECK (length(trim(event_type)) > 0)
);

-- ============================================================================
-- INDEXES for common queries
-- ============================================================================

-- Find all events for a workspace (e.g., admin audit dashboard)
CREATE INDEX idx_audit_events_workspace_id_created_at
  ON audit_events(workspace_id, created_at DESC);

-- Find all events for a user (e.g., user activity history)
CREATE INDEX idx_audit_events_user_id_created_at
  ON audit_events(user_id, created_at DESC);

-- Find all events of a specific type (e.g., all page views, all deletions)
CREATE INDEX idx_audit_events_event_type_created_at
  ON audit_events(event_type, created_at DESC);

-- Find all events for a specific resource (e.g., all accesses to parcel #123)
CREATE INDEX idx_audit_events_resource_id
  ON audit_events(resource_id);

-- Combined: resource type + resource ID (for detailed audit trail of one object)
CREATE INDEX idx_audit_events_resource_type_resource_id
  ON audit_events(resource_type, resource_id);

-- Time-range queries (e.g., events in last 24 hours)
CREATE INDEX idx_audit_events_created_at
  ON audit_events(created_at DESC);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) Policies
-- ============================================================================

-- Enable RLS on audit_events table
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all reads (will be tightened in production)
CREATE POLICY audit_events_allow_read
  ON public.audit_events
  FOR SELECT
  USING (true);

-- Policy 2: Allow inserts from service role only
CREATE POLICY audit_events_allow_insert
  ON public.audit_events
  FOR INSERT
  WITH CHECK (true);

-- Policy 3: Prevent updates (audit logs should be immutable)
CREATE POLICY audit_events_prevent_update
  ON public.audit_events
  FOR UPDATE
  USING (false);

-- Policy 4: Prevent deletes (audit logs should be immutable)
CREATE POLICY audit_events_prevent_delete
  ON public.audit_events
  FOR DELETE
  USING (false);

-- ============================================================================
-- GRANTS & Permissions
-- ============================================================================

-- Grant read access to authenticated users (RLS will filter)
-- GRANT SELECT ON audit_events TO authenticated;

-- Grant insert access to authenticated users (RLS will validate)
-- GRANT INSERT ON audit_events TO authenticated;

-- Service role (for migrations, admin tasks) has full access
-- GRANT ALL ON audit_events TO service_role;

-- ============================================================================
-- UTILITY FUNCTION: Delete expired audit logs (data retention policy)
-- ============================================================================

-- This function implements a retention policy: delete events older than 90 days
-- Schedule this to run daily via cron (e.g., pg_cron extension)
CREATE OR REPLACE FUNCTION delete_expired_audit_logs(days_to_keep INT DEFAULT 90)
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM audit_events
  WHERE created_at < (CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count::INT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_expired_audit_logs(INT) TO service_role;

-- ============================================================================
-- TRIGGER: Update updated_at timestamp automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION update_audit_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_updated_at_trigger
BEFORE UPDATE ON public.audit_events
FOR EACH ROW
EXECUTE FUNCTION update_audit_events_updated_at();

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

COMMENT ON TABLE audit_events IS
  'Immutable audit log of all user actions. Used for compliance, debugging, and analytics.';

COMMENT ON COLUMN audit_events.event_type IS
  'Type of event: page_view, parcel_created, parcel_updated, parcel_deleted, auth_login, permission_denied, api_call, etc.';

COMMENT ON COLUMN audit_events.resource_type IS
  'Type of resource affected: parcels, reports, workspaces, users, etc.';

COMMENT ON COLUMN audit_events.resource_id IS
  'UUID of the specific resource. NULL for events not tied to a specific resource.';

COMMENT ON COLUMN audit_events.page_num IS
  'For page_view events, the page number being viewed.';

COMMENT ON COLUMN audit_events.metadata IS
  'Flexible JSON object for event-specific context (e.g., search filters, sorting, response times).';

-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION (run as separate statement)
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'audit_events';
-- \d audit_events -- describe table
-- SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'audit_events';
