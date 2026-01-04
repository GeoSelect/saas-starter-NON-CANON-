-- CCP-07: Data Sources & Rule Management
-- Tracks authoritative sources, rule definitions, citations, and data gaps

-- Authoritative sources (HOA CCRs, jurisdiction codes, ordinances, etc.)
CREATE TABLE IF NOT EXISTS public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'hoa_ccr', 'jurisdiction_code', 'ordinance', 'county_records', 'assessor', 'zoning', 'custom'
  url TEXT,
  jurisdiction TEXT, -- Associated jurisdiction (e.g., 'Telluride, CO')
  last_verified_at TIMESTAMPTZ,
  confidence_level TEXT NOT NULL DEFAULT 'pending', -- 'verified', 'inferred', 'pending'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT source_non_empty CHECK (name IS NOT NULL AND type IS NOT NULL)
);

CREATE INDEX idx_sources_type ON public.sources(type);
CREATE INDEX idx_sources_jurisdiction ON public.sources(jurisdiction);
CREATE INDEX idx_sources_confidence ON public.sources(confidence_level);
CREATE INDEX idx_sources_verified_at ON public.sources(last_verified_at DESC);

-- Rule/constraint definitions linked to workspaces and parcels
CREATE TABLE IF NOT EXISTS public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parcel_id VARCHAR(128), -- Reference to parcel (not a foreign key, just a reference)
  rule_type TEXT NOT NULL, -- 'setback', 'height_limit', 'density', 'use_restriction', 'parking', 'other'
  description TEXT NOT NULL,
  details JSONB, -- Additional rule metadata (e.g., {"setback_feet": 25, "applies_to": "rear"})
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT rule_workspace_workspace CHECK (workspace_id IS NOT NULL),
  CONSTRAINT rule_type_non_empty CHECK (rule_type IS NOT NULL)
);

CREATE INDEX idx_rules_workspace_id ON public.rules(workspace_id);
CREATE INDEX idx_rules_parcel_id ON public.rules(parcel_id);
CREATE INDEX idx_rules_rule_type ON public.rules(rule_type);
CREATE INDEX idx_rules_created_at ON public.rules(created_at DESC);

-- Link rules to sources (many-to-many)
-- A rule can have multiple sources, a source can be cited by multiple rules
CREATE TABLE IF NOT EXISTS public.rule_sources (
  rule_id UUID NOT NULL REFERENCES public.rules(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  citation TEXT, -- e.g., "Section 4.2, Paragraph 3" or "HOA CC&R Article IV, Section 2.1"
  citation_date TIMESTAMPTZ, -- When this citation was verified
  PRIMARY KEY (rule_id, source_id)
);

CREATE INDEX idx_rule_sources_rule_id ON public.rule_sources(rule_id);
CREATE INDEX idx_rule_sources_source_id ON public.rule_sources(source_id);

-- Data gaps/conflicts - for tracking missing, conflicting, or outdated information
CREATE TABLE IF NOT EXISTS public.data_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parcel_id VARCHAR(128), -- Reference to parcel
  gap_type TEXT NOT NULL, -- 'missing', 'conflict', 'outdated', 'unverified'
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'critical', 'warning', 'info'
  resolution_status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved'
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  CONSTRAINT gap_type_valid CHECK (gap_type IN ('missing', 'conflict', 'outdated', 'unverified')),
  CONSTRAINT severity_valid CHECK (severity IN ('critical', 'warning', 'info')),
  CONSTRAINT status_valid CHECK (resolution_status IN ('open', 'investigating', 'resolved'))
);

CREATE INDEX idx_data_gaps_workspace_id ON public.data_gaps(workspace_id);
CREATE INDEX idx_data_gaps_parcel_id ON public.data_gaps(parcel_id);
CREATE INDEX idx_data_gaps_gap_type ON public.data_gaps(gap_type);
CREATE INDEX idx_data_gaps_severity ON public.data_gaps(severity);
CREATE INDEX idx_data_gaps_resolution_status ON public.data_gaps(resolution_status);
CREATE INDEX idx_data_gaps_created_at ON public.data_gaps(created_at DESC);

-- RLS Policies for sources (public read, workspace members can manage)
CREATE POLICY sources_select_public ON public.sources
  FOR SELECT
  USING (true); -- Sources are public reference data

-- Workspace members can create sources (e.g., by uploading custom ordinances)
CREATE POLICY sources_insert_member ON public.sources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for rules (workspace members only)
CREATE POLICY rules_select_member ON public.rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = rules.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY rules_insert_member ON public.rules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = rules.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY rules_update_member ON public.rules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = rules.workspace_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = rules.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY rules_delete_member ON public.rules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = rules.workspace_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for rule_sources
CREATE POLICY rule_sources_select_member ON public.rule_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rules
      WHERE id = rule_sources.rule_id
      AND EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = rules.workspace_id
        AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY rule_sources_insert_member ON public.rule_sources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rules
      WHERE id = rule_sources.rule_id
      AND EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = rules.workspace_id
        AND user_id = auth.uid()
      )
    )
  );

-- RLS Policies for data_gaps (workspace members only)
CREATE POLICY data_gaps_select_member ON public.data_gaps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = data_gaps.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY data_gaps_insert_member ON public.data_gaps
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = data_gaps.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY data_gaps_update_member ON public.data_gaps
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = data_gaps.workspace_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = data_gaps.workspace_id
      AND user_id = auth.uid()
    )
  );

-- Enable RLS
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_gaps ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT SELECT ON public.sources TO authenticated;
GRANT INSERT, UPDATE ON public.sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rule_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_gaps TO authenticated;
