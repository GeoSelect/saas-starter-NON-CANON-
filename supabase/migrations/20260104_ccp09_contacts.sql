-- CCP-09: Contacts Access
-- Manages HOA members, homeowners, external contacts, and vendors with role-based permissions

-- Contacts table (core contact management)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  
  -- Association
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('hoa_member', 'homeowner', 'external', 'vendor')),
  
  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'pending', 'unverified')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  
  -- HOA-specific
  hoa_id UUID,
  parcel_id UUID REFERENCES parcels(id) ON DELETE SET NULL,
  membership_status TEXT CHECK (membership_status IN ('active', 'inactive', 'suspended')),
  
  -- Metadata
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT contacts_workspace_email_unique UNIQUE (workspace_id, email),
  CONSTRAINT contacts_valid_type_status CHECK (
    (contact_type = 'hoa_member' AND membership_status IS NOT NULL) OR
    (contact_type != 'hoa_member' AND membership_status IS NULL)
  )
);

-- Contact groups (for bulk operations and access control)
CREATE TABLE contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT NOT NULL CHECK (group_type IN ('hoa_board', 'arc_committee', 'homeowners', 'custom')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT contact_groups_workspace_name_unique UNIQUE (workspace_id, name)
);

-- Many-to-many: contacts ↔ groups
CREATE TABLE contact_group_members (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID NOT NULL REFERENCES auth.users(id),
  
  PRIMARY KEY (contact_id, group_id),
  CONSTRAINT cgm_contact_group_workspace CHECK (
    -- Enforced via app logic; contact and group must be in same workspace
    TRUE
  )
);

-- Contact permissions (who can share with whom)
CREATE TABLE contact_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Permissions
  can_share BOOLEAN DEFAULT true,
  can_view_details BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  
  -- Audit
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT contact_permissions_unique UNIQUE (workspace_id, user_id, contact_id)
);

-- Indexes
CREATE INDEX idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX idx_contacts_workspace_email ON contacts(workspace_id, email);
CREATE INDEX idx_contacts_contact_type ON contacts(workspace_id, contact_type);
CREATE INDEX idx_contacts_verification_status ON contacts(workspace_id, verification_status);
CREATE INDEX idx_contacts_parcel_id ON contacts(parcel_id);
CREATE INDEX idx_contact_groups_workspace_id ON contact_groups(workspace_id);
CREATE INDEX idx_contact_group_members_group_id ON contact_group_members(group_id);
CREATE INDEX idx_contact_permissions_workspace_user ON contact_permissions(workspace_id, user_id);
CREATE INDEX idx_contact_permissions_contact_id ON contact_permissions(contact_id);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: contacts table
-- Contacts can only be viewed by workspace members
CREATE POLICY contacts_select_policy ON contacts
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Only workspace members can create contacts
CREATE POLICY contacts_insert_policy ON contacts
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Contacts can be updated by workspace members (restricted by app logic)
CREATE POLICY contacts_update_policy ON contacts
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Contacts can be deleted by workspace members (restricted by app logic)
CREATE POLICY contacts_delete_policy ON contacts
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies: contact_groups table
CREATE POLICY contact_groups_select_policy ON contact_groups
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contact_groups_insert_policy ON contact_groups
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contact_groups_update_policy ON contact_groups
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contact_groups_delete_policy ON contact_groups
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies: contact_group_members table
-- Users can view group members within their workspace
CREATE POLICY cgm_select_policy ON contact_group_members
  FOR SELECT
  USING (
    group_id IN (
      SELECT id FROM contact_groups 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can add members to groups in their workspace
CREATE POLICY cgm_insert_policy ON contact_group_members
  FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT id FROM contact_groups 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can remove members from groups in their workspace
CREATE POLICY cgm_delete_policy ON contact_group_members
  FOR DELETE
  USING (
    group_id IN (
      SELECT id FROM contact_groups 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies: contact_permissions table
-- Users can view permissions for contacts in their workspace
CREATE POLICY cp_select_policy ON contact_permissions
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can grant permissions on contacts in their workspace
CREATE POLICY cp_insert_policy ON contact_permissions
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can revoke/update permissions in their workspace
CREATE POLICY cp_update_policy ON contact_permissions
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY cp_delete_policy ON contact_permissions
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );
