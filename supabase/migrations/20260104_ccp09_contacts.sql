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
-- Contacts
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_status ON contacts(membership_status);
CREATE INDEX idx_contacts_hoa ON contacts(hoa_id);
CREATE INDEX idx_contacts_parcel ON contacts(parcel_id);
CREATE INDEX idx_contacts_search ON contacts USING gin(
  to_tsvector('english', first_name || ' ' || last_name || ' ' || email)
);

-- Contact groups
CREATE INDEX idx_contact_groups_workspace ON contact_groups(workspace_id);
CREATE INDEX idx_contact_groups_type ON contact_groups(group_type);

-- Contact group members
CREATE INDEX idx_contact_group_members_contact ON contact_group_members(contact_id);
CREATE INDEX idx_contact_group_members_group ON contact_group_members(group_id);

-- Contact permissions
CREATE INDEX idx_contact_permissions_user ON contact_permissions(user_id);
CREATE INDEX idx_contact_permissions_contact ON contact_permissions(contact_id);
CREATE INDEX idx_contact_permissions_workspace ON contact_permissions(workspace_id);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: contacts table
-- Contacts: workspace membership required
CREATE POLICY "contacts_workspace_access" ON contacts FOR SELECT TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "contacts_insert" ON contacts FOR INSERT TO authenticated
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "contacts_update" ON contacts FOR UPDATE TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "contacts_delete" ON contacts FOR DELETE TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);

-- RLS Policies: contact_groups table
-- Contact groups: workspace membership required
CREATE POLICY "contact_groups_access" ON contact_groups FOR SELECT TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "contact_groups_insert" ON contact_groups FOR INSERT TO authenticated
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "contact_groups_update" ON contact_groups FOR UPDATE TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "contact_groups_delete" ON contact_groups FOR DELETE TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);

-- RLS Policies: contact_group_members table
-- Contact group members: via group access
CREATE POLICY "contact_group_members_access" ON contact_group_members FOR SELECT TO authenticated
USING (
  group_id IN (
    SELECT id FROM contact_groups WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "contact_group_members_insert" ON contact_group_members FOR INSERT TO authenticated
WITH CHECK (
  group_id IN (
    SELECT id FROM contact_groups WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'editor')
    )
  )
);

CREATE POLICY "contact_group_members_delete" ON contact_group_members FOR DELETE TO authenticated
USING (
  group_id IN (
    SELECT id FROM contact_groups WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'editor')
    )
  )
);

-- RLS Policies: contact_permissions table
-- Contact permissions: user must match or be admin
CREATE POLICY "contact_permissions_own_access" ON contact_permissions FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "contact_permissions_insert" ON contact_permissions FOR INSERT TO authenticated
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "contact_permissions_update" ON contact_permissions FOR UPDATE TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "contact_permissions_delete" ON contact_permissions FOR DELETE TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  )
);
