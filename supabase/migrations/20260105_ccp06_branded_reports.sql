-- CCP-06: Branded Reports
-- Workspace-scoped branded reports with immutable projection and versioned branding
-- RLS enforces workspace membership for all operations

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM ('draft', 'published', 'archived');

-- Create branded_reports table
CREATE TABLE IF NOT EXISTS public.branded_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Report metadata
  name VARCHAR(255) NOT NULL,
  status public.report_status NOT NULL DEFAULT 'draft',
  
  -- Frozen projection (immutable after creation)
  -- Stored as JSONB for flexible queries
  -- Schema: { parcel_id: string, location: { lat: number, lng: number }, intent: string }
  projection JSONB NOT NULL,
  
  -- Workspace branding cascade
  -- Schema: { workspace_name: string, color_primary?: string, logo_url?: string, ... }
  branding JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT branded_reports_workspace_exists CHECK (workspace_id IS NOT NULL),
  CONSTRAINT branded_reports_name_length CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  CONSTRAINT branded_reports_projection_required CHECK (projection IS NOT NULL),
  CONSTRAINT branded_reports_branding_required CHECK (branding IS NOT NULL)
);

-- Create indexes for fast lookups
CREATE INDEX idx_branded_reports_workspace_id ON public.branded_reports(workspace_id);
CREATE INDEX idx_branded_reports_workspace_status ON public.branded_reports(workspace_id, status);
CREATE INDEX idx_branded_reports_created_at ON public.branded_reports(created_at DESC);
CREATE INDEX idx_branded_reports_updated_at ON public.branded_reports(updated_at DESC);
CREATE INDEX idx_branded_reports_workspace_created ON public.branded_reports(workspace_id, created_at DESC);

-- Full text search index on name
CREATE INDEX idx_branded_reports_name ON public.branded_reports USING GIN(to_tsvector('english', name));

-- RLS Policy: Users can only view reports in workspaces they're members of
CREATE POLICY branded_reports_select ON public.branded_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = branded_reports.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Only workspace admins/owners can insert reports
-- Membership check ensures caller is in the workspace
CREATE POLICY branded_reports_insert ON public.branded_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = branded_reports.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND (workspace_members.role = 'owner' OR workspace_members.role = 'admin')
    )
  );

-- RLS Policy: Only workspace admins/owners can update reports
CREATE POLICY branded_reports_update ON public.branded_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = branded_reports.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND (workspace_members.role = 'owner' OR workspace_members.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = branded_reports.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND (workspace_members.role = 'owner' OR workspace_members.role = 'admin')
    )
  );

-- RLS Policy: Only workspace admins/owners can delete reports
CREATE POLICY branded_reports_delete ON public.branded_reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = branded_reports.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND (workspace_members.role = 'owner' OR workspace_members.role = 'admin')
    )
  );

-- Enable RLS
ALTER TABLE public.branded_reports ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users (RLS gates further)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branded_reports TO authenticated;

-- Create audit log table for branded_reports changes
CREATE TABLE IF NOT EXISTS public.branded_reports_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.branded_reports(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_branded_reports_audit_report_id ON public.branded_reports_audit(report_id);
CREATE INDEX idx_branded_reports_audit_workspace_id ON public.branded_reports_audit(workspace_id);
CREATE INDEX idx_branded_reports_audit_actor_id ON public.branded_reports_audit(actor_id);
CREATE INDEX idx_branded_reports_audit_created_at ON public.branded_reports_audit(created_at DESC);

-- Grant audit table access
GRANT SELECT ON public.branded_reports_audit TO authenticated;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_branded_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branded_reports_update_updated_at
BEFORE UPDATE ON public.branded_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_branded_reports_updated_at();

-- Create trigger for audit logging
CREATE OR REPLACE FUNCTION public.audit_branded_reports_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_type VARCHAR(50);
  changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    changes := jsonb_object_agg(
      key,
      CASE 
        WHEN old_val IS DISTINCT FROM new_val THEN jsonb_build_object('old', old_val, 'new', new_val)
        ELSE NULL
      END
    ) FILTER (WHERE old_val IS DISTINCT FROM new_val)
    FROM jsonb_each(to_jsonb(OLD)) AS old_row(key, old_val)
    JOIN jsonb_each(to_jsonb(NEW)) AS new_row(key, new_val) ON old_row.key = new_row.key;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    changes := to_jsonb(OLD);
  END IF;

  INSERT INTO public.branded_reports_audit(report_id, workspace_id, action, actor_id, changes)
  VALUES (COALESCE(NEW.id, OLD.id), COALESCE(NEW.workspace_id, OLD.workspace_id), action_type, auth.uid(), changes);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branded_reports_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.branded_reports
FOR EACH ROW
EXECUTE FUNCTION public.audit_branded_reports_changes();
