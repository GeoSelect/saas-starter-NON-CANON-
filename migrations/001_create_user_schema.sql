-- CCP-00: User Identity & Account Context Schema
-- Designed for Peter's operator-centric, workspace-driven workflow

-- 1. Users Table (Identity Layer)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(2048),
  
  -- Operator Role (global)
  role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('property_manager', 'admin', 'staff', 'viewer')),
  title VARCHAR(255),
  
  -- Status & Trust
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  requires_reauth BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Workspaces Table (Container for HOAs / Portfolios)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  organization_name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(50) NOT NULL CHECK (organization_type IN ('hoa', 'portfolio', 'management_company')),
  
  -- Contact & Location
  primary_contact_email VARCHAR(255),
  address JSONB, -- { street, city, state, zip }
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Workspace Memberships (User + Workspace + Role)
CREATE TABLE IF NOT EXISTS public.workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Workspace-specific role
  workspace_role VARCHAR(50) NOT NULL CHECK (workspace_role IN ('owner', 'manager', 'editor', 'viewer')),
  
  -- Entitlements (pre-computed, UI-critical)
  can_resolve_parcels BOOLEAN DEFAULT false,
  can_create_reports BOOLEAN DEFAULT false,
  can_share_reports BOOLEAN DEFAULT false,
  can_view_audit_log BOOLEAN DEFAULT false,
  can_manage_contacts BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, workspace_id)
);

-- 4. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Operational Defaults
  default_map_view VARCHAR(50) DEFAULT 'satellite' CHECK (default_map_view IN ('satellite', 'streets', 'terrain')),
  default_report_type VARCHAR(255) DEFAULT 'Parcel IQ HOA',
  show_sources_expanded BOOLEAN DEFAULT false,
  mobile_first BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. User Activity Table (Operational Signals, Not Analytics)
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Activity Types & Context
  activity_type VARCHAR(100) NOT NULL, -- 'parcel_viewed', 'report_created', 'report_shared', etc.
  resource_id VARCHAR(255), -- parcel_id, report_id, etc.
  resource_type VARCHAR(100), -- 'parcel', 'report', 'contact', etc.
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_active ON public.workspaces(is_active);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.workspace_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_workspace_id ON public.workspace_memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_workspace ON public.workspace_memberships(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_workspace ON public.user_activity(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.user_activity(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Workspace members can view workspace details
CREATE POLICY "Workspace members can view workspace" ON public.workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM public.workspace_memberships 
      WHERE user_id = auth.uid()::uuid AND is_active = true
    )
  );

-- Workspace members can view their own memberships
CREATE POLICY "Users can view their workspace memberships" ON public.workspace_memberships
  FOR SELECT USING (user_id = auth.uid()::uuid);
