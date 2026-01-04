-- CCP-10: Report Sharing - Share Links Data Model
-- Secure, time-limited access to reports with audit trails

-- ========================================
-- SHARE LINKS TABLE
-- ========================================
-- Main table for shareable links with time-limited, role-based access
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link identity
  token TEXT NOT NULL UNIQUE, -- Cryptographically secure token
  short_code TEXT UNIQUE, -- Optional short code (e.g., "abc123")
  
  -- Associations
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  snapshot_id UUID REFERENCES report_snapshots(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Recipient (optional - can be anonymous or contact-specific)
  recipient_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  recipient_email TEXT, -- Email for notification
  
  -- Access control
  access_role TEXT CHECK (access_role IN ('viewer', 'commenter', 'editor')) DEFAULT 'viewer',
  requires_auth BOOLEAN DEFAULT false, -- Must be logged in
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  
  -- Usage tracking
  view_count INT DEFAULT 0,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  max_views INT, -- Optional view limit
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT share_links_check_revoked CHECK (
    (revoked_at IS NULL AND revoked_by IS NULL) OR 
    (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
  ),
  CONSTRAINT share_links_check_expiration CHECK (expires_at > created_at)
);

-- ========================================
-- SHARE LINK EVENTS TABLE (Audit Trail - CCP-15)
-- ========================================
-- Event log for all share link access
CREATE TABLE share_link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link reference
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE NOT NULL,
  
  -- Event details
  event_type TEXT CHECK (event_type IN (
    'created', 
    'viewed', 
    'downloaded', 
    'revoked', 
    'expired',
    'access_denied'
  )) NOT NULL,
  
  -- Actor (who performed the action)
  actor_user_id UUID REFERENCES auth.users(id), -- If authenticated
  actor_ip_address INET,
  actor_user_agent TEXT,
  
  -- Context
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- SHARE LINK PERMISSIONS TABLE (CCP-12)
-- ========================================
-- Role-based permissions for share links
CREATE TABLE share_link_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE NOT NULL,
  
  -- Permission details
  permission_type TEXT CHECK (permission_type IN (
    'view', 
    'comment', 
    'download', 
    'share'
  )) NOT NULL,
  granted BOOLEAN DEFAULT true,
  
  -- Audit
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT share_link_permissions_unique UNIQUE (share_link_id, permission_type)
);

-- ========================================
-- SHARE NOTIFICATIONS TABLE (CCP-13)
-- ========================================
-- Email notification tracking for share links
CREATE TABLE share_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE NOT NULL,
  
  -- Recipient
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Message
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'bounced')) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- INDEXES - Performance Optimization
-- ========================================

-- Share Links Indexes
CREATE INDEX idx_share_links_workspace_id ON share_links(workspace_id);
CREATE INDEX idx_share_links_snapshot_id ON share_links(snapshot_id);
CREATE INDEX idx_share_links_created_by ON share_links(created_by);
CREATE INDEX idx_share_links_token ON share_links(token); -- Already unique, but explicit index
CREATE INDEX idx_share_links_expires_at ON share_links(expires_at);
CREATE INDEX idx_share_links_revoked_at ON share_links(revoked_at);
CREATE INDEX idx_share_links_recipient_contact_id ON share_links(recipient_contact_id);
CREATE INDEX idx_share_links_active ON share_links(workspace_id, revoked_at, expires_at) WHERE revoked_at IS NULL;

-- Share Link Events Indexes
CREATE INDEX idx_share_link_events_share_link_id ON share_link_events(share_link_id);
CREATE INDEX idx_share_link_events_created_at ON share_link_events(created_at);
CREATE INDEX idx_share_link_events_event_type ON share_link_events(event_type);
CREATE INDEX idx_share_link_events_actor_user_id ON share_link_events(actor_user_id);
CREATE INDEX idx_share_link_events_link_event ON share_link_events(share_link_id, event_type);

-- Share Link Permissions Indexes
CREATE INDEX idx_share_link_permissions_share_link_id ON share_link_permissions(share_link_id);
CREATE INDEX idx_share_link_permissions_type ON share_link_permissions(permission_type);

-- Share Notifications Indexes
CREATE INDEX idx_share_notifications_share_link_id ON share_notifications(share_link_id);
CREATE INDEX idx_share_notifications_recipient_email ON share_notifications(recipient_email);
CREATE INDEX idx_share_notifications_status ON share_notifications(status);
CREATE INDEX idx_share_notifications_created_at ON share_notifications(created_at);

-- ========================================
-- RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_notifications ENABLE ROW LEVEL SECURITY;

-- SHARE LINKS: Creators can view/revoke their own links
CREATE POLICY "share_links_select_own" ON share_links
  FOR SELECT USING (
    created_by = auth.uid()
  );

-- SHARE LINKS: Workspace editors/owners can view all links in workspace
CREATE POLICY "share_links_select_workspace_members" ON share_links
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- SHARE LINKS: Only creators can insert share links
CREATE POLICY "share_links_insert" ON share_links
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- SHARE LINKS: Only creators/revokers can update (for revocation)
CREATE POLICY "share_links_update" ON share_links
  FOR UPDATE USING (
    created_by = auth.uid() OR revoked_by = auth.uid()
  ) WITH CHECK (
    created_by = auth.uid() OR revoked_by = auth.uid()
  );

-- SHARE LINKS: Only workspace owners can delete
CREATE POLICY "share_links_delete" ON share_links
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- SHARE LINK EVENTS: Only workspace members can view events
CREATE POLICY "share_link_events_select" ON share_link_events
  FOR SELECT USING (
    share_link_id IN (
      SELECT id FROM share_links WHERE
      workspace_id IN (
        SELECT workspace_id FROM workspace_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- SHARE LINK EVENTS: System can insert events (via auth context)
CREATE POLICY "share_link_events_insert" ON share_link_events
  FOR INSERT WITH CHECK (true);

-- SHARE LINK PERMISSIONS: Workspace members can view permissions
CREATE POLICY "share_link_permissions_select" ON share_link_permissions
  FOR SELECT USING (
    share_link_id IN (
      SELECT id FROM share_links WHERE
      workspace_id IN (
        SELECT workspace_id FROM workspace_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- SHARE LINK PERMISSIONS: Only link creators can insert permissions
CREATE POLICY "share_link_permissions_insert" ON share_link_permissions
  FOR INSERT WITH CHECK (
    share_link_id IN (
      SELECT id FROM share_links WHERE created_by = auth.uid()
    )
  );

-- SHARE NOTIFICATIONS: Workspace members can view notifications
CREATE POLICY "share_notifications_select" ON share_notifications
  FOR SELECT USING (
    share_link_id IN (
      SELECT id FROM share_links WHERE
      workspace_id IN (
        SELECT workspace_id FROM workspace_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- SHARE NOTIFICATIONS: System can insert/update notifications
CREATE POLICY "share_notifications_insert" ON share_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "share_notifications_update" ON share_notifications
  FOR UPDATE USING (true) WITH CHECK (true);

-- ========================================
-- RBAC SYSTEM TABLES
-- ========================================

-- Role definitions (system table)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'viewer', 'commenter', 'editor', 'owner'
  display_name TEXT NOT NULL,
  description TEXT,
  hierarchy_level INT NOT NULL, -- 1=viewer, 2=commenter, 3=editor, 4=owner
  is_system_role BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions (system table)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'view', 'comment', 'download', 'share', 'edit', 'delete'
  display_name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL, -- 'snapshot', 'workspace', 'contact', etc.
  is_system_permission BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Role-Permission mapping (what each role can do)
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  PRIMARY KEY (role_id, permission_id)
);

-- Event associations (who shared what with whom)
CREATE TABLE event_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core association
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES report_snapshots(id) ON DELETE CASCADE,
  
  -- Participants
  sharer_user_id UUID REFERENCES auth.users(id) NOT NULL, -- Peter
  recipient_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Homeowner
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If recipient is registered user
  
  -- Role assignment
  assigned_role_id UUID REFERENCES roles(id) NOT NULL,
  role_assigned_at TIMESTAMPTZ DEFAULT now(),
  role_assigned_by UUID REFERENCES auth.users(id),
  
  -- Association metadata
  association_type TEXT CHECK (association_type IN (
    'direct_share',      -- Peter → Homeowner
    'group_share',       -- Peter → HOA Board (group)
    'public_share',      -- Peter → Anyone with link
    'internal_share'     -- Peter → Team member
  )) NOT NULL,
  
  -- Context
  share_reason TEXT, -- "ARC review needed", "Compliance check", etc.
  expiration_override TIMESTAMPTZ, -- Override share link expiration
  
  -- Governance
  acknowledged_warning BOOLEAN DEFAULT false, -- Did user see "creating record" warning?
  acknowledged_at TIMESTAMPTZ,
  
  -- Tracking
  relationship_status TEXT CHECK (relationship_status IN (
    'active',
    'expired',
    'revoked',
    'transferred'
  )) DEFAULT 'active',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Permission overrides (per-association custom permissions)
CREATE TABLE event_association_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_association_id UUID REFERENCES event_associations(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  override_reason TEXT,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT event_association_permissions_unique UNIQUE (event_association_id, permission_id)
);

-- Role change history (audit trail for role changes)
CREATE TABLE role_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_association_id UUID REFERENCES event_associations(id) ON DELETE CASCADE,
  
  -- Change details
  previous_role_id UUID REFERENCES roles(id),
  new_role_id UUID REFERENCES roles(id) NOT NULL,
  
  -- Who and why
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  change_reason TEXT,
  
  -- Timestamp
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Governance warnings (track that user saw warnings)
CREATE TABLE governance_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  warning_type TEXT CHECK (warning_type IN (
    'record_creation',
    'permanent_share',
    'external_recipient',
    'sensitive_data'
  )) NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- RBAC INDEXES
-- ========================================

-- Roles indexes
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_hierarchy_level ON roles(hierarchy_level);

-- Permissions indexes
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource_type ON permissions(resource_type);

-- Event associations indexes
CREATE INDEX idx_event_associations_share_link_id ON event_associations(share_link_id);
CREATE INDEX idx_event_associations_workspace_id ON event_associations(workspace_id);
CREATE INDEX idx_event_associations_snapshot_id ON event_associations(snapshot_id);
CREATE INDEX idx_event_associations_sharer_user_id ON event_associations(sharer_user_id);
CREATE INDEX idx_event_associations_recipient_contact_id ON event_associations(recipient_contact_id);
CREATE INDEX idx_event_associations_recipient_user_id ON event_associations(recipient_user_id);
CREATE INDEX idx_event_associations_status ON event_associations(relationship_status);
CREATE INDEX idx_event_associations_type ON event_associations(association_type);

-- Event association permissions indexes
CREATE INDEX idx_event_association_permissions_association_id ON event_association_permissions(event_association_id);
CREATE INDEX idx_event_association_permissions_permission_id ON event_association_permissions(permission_id);

-- Role change history indexes
CREATE INDEX idx_role_change_history_association_id ON role_change_history(event_association_id);
CREATE INDEX idx_role_change_history_changed_at ON role_change_history(changed_at);

-- Governance warnings indexes
CREATE INDEX idx_governance_warnings_user_id ON governance_warnings(user_id);
CREATE INDEX idx_governance_warnings_workspace_id ON governance_warnings(workspace_id);
CREATE INDEX idx_governance_warnings_type ON governance_warnings(warning_type);

-- ========================================
-- RBAC RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_association_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_warnings ENABLE ROW LEVEL SECURITY;

-- ROLES: Public read access (system table)
CREATE POLICY "roles_select_all" ON roles
  FOR SELECT USING (true);

-- PERMISSIONS: Public read access (system table)
CREATE POLICY "permissions_select_all" ON permissions
  FOR SELECT USING (true);

-- ROLE_PERMISSIONS: Public read access (system table)
CREATE POLICY "role_permissions_select_all" ON role_permissions
  FOR SELECT USING (true);

-- EVENT_ASSOCIATIONS: Users can view associations they created or are recipients of
CREATE POLICY "event_associations_select" ON event_associations
  FOR SELECT USING (
    sharer_user_id = auth.uid() OR 
    recipient_user_id = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  );

-- EVENT_ASSOCIATIONS: Only sharers can create associations
CREATE POLICY "event_associations_insert" ON event_associations
  FOR INSERT WITH CHECK (
    sharer_user_id = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- EVENT_ASSOCIATIONS: Only sharers can update their associations
CREATE POLICY "event_associations_update" ON event_associations
  FOR UPDATE USING (
    sharer_user_id = auth.uid()
  ) WITH CHECK (
    sharer_user_id = auth.uid()
  );

-- EVENT_ASSOCIATION_PERMISSIONS: Users can view permissions for their associations
CREATE POLICY "event_association_permissions_select" ON event_association_permissions
  FOR SELECT USING (
    event_association_id IN (
      SELECT id FROM event_associations WHERE
      sharer_user_id = auth.uid() OR 
      recipient_user_id = auth.uid()
    )
  );

-- EVENT_ASSOCIATION_PERMISSIONS: Only sharers can grant permissions
CREATE POLICY "event_association_permissions_insert" ON event_association_permissions
  FOR INSERT WITH CHECK (
    event_association_id IN (
      SELECT id FROM event_associations WHERE sharer_user_id = auth.uid()
    ) AND
    granted_by = auth.uid()
  );

-- ROLE_CHANGE_HISTORY: Users can view role changes for their associations
CREATE POLICY "role_change_history_select" ON role_change_history
  FOR SELECT USING (
    event_association_id IN (
      SELECT id FROM event_associations WHERE
      sharer_user_id = auth.uid() OR 
      recipient_user_id = auth.uid()
    )
  );

-- ROLE_CHANGE_HISTORY: System can insert role change records
CREATE POLICY "role_change_history_insert" ON role_change_history
  FOR INSERT WITH CHECK (
    changed_by = auth.uid()
  );

-- GOVERNANCE_WARNINGS: Users can only see their own warnings
CREATE POLICY "governance_warnings_select_own" ON governance_warnings
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- GOVERNANCE_WARNINGS: Users can insert their own warnings
CREATE POLICY "governance_warnings_insert" ON governance_warnings
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- GOVERNANCE_WARNINGS: Users can update their own warnings
CREATE POLICY "governance_warnings_update" ON governance_warnings
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );

-- ========================================
-- SEED DATA: System Roles and Permissions
-- ========================================

-- Insert system roles
INSERT INTO roles (name, display_name, description, hierarchy_level, is_system_role) VALUES
  ('viewer', 'Viewer', 'Can view shared content', 1, true),
  ('commenter', 'Commenter', 'Can view and add comments', 2, true),
  ('editor', 'Editor', 'Can view, comment, and download', 3, true),
  ('owner', 'Owner', 'Full control over content', 4, true);

-- Insert system permissions
INSERT INTO permissions (name, display_name, description, resource_type, is_system_permission) VALUES
  -- Snapshot permissions
  ('snapshot.view', 'View Snapshot', 'Can view report snapshots', 'snapshot', true),
  ('snapshot.comment', 'Comment on Snapshot', 'Can add comments to snapshots', 'snapshot', true),
  ('snapshot.download', 'Download Snapshot', 'Can download snapshot data', 'snapshot', true),
  ('snapshot.share', 'Share Snapshot', 'Can create share links', 'snapshot', true),
  ('snapshot.edit', 'Edit Snapshot', 'Can modify snapshot metadata', 'snapshot', true),
  ('snapshot.delete', 'Delete Snapshot', 'Can delete snapshots', 'snapshot', true),
  
  -- Workspace permissions
  ('workspace.view', 'View Workspace', 'Can view workspace content', 'workspace', true),
  ('workspace.edit', 'Edit Workspace', 'Can modify workspace settings', 'workspace', true),
  ('workspace.manage_members', 'Manage Members', 'Can add/remove workspace members', 'workspace', true),
  
  -- Contact permissions
  ('contact.view', 'View Contact', 'Can view contact details', 'contact', true),
  ('contact.share', 'Share with Contact', 'Can share content with contact', 'contact', true);

-- Map roles to permissions
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r
CROSS JOIN permissions p
WHERE 
  -- Viewer permissions
  (r.name = 'viewer' AND p.name IN ('snapshot.view')) OR
  
  -- Commenter permissions (includes viewer)
  (r.name = 'commenter' AND p.name IN ('snapshot.view', 'snapshot.comment')) OR
  
  -- Editor permissions (includes commenter)
  (r.name = 'editor' AND p.name IN ('snapshot.view', 'snapshot.comment', 'snapshot.download')) OR
  
  -- Owner permissions (all)
  (r.name = 'owner' AND p.resource_type = 'snapshot');
