-- CCP-05: Active Workspace Selection
-- Tracks the current session-level workspace context for each user
-- RLS enforces that users can only set active workspace if they're members

CREATE TABLE IF NOT EXISTS public.user_active_workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one active workspace per user
  UNIQUE(user_id),
  
  -- Indexes for fast lookup
  CONSTRAINT user_workspace_exist CHECK (user_id IS NOT NULL AND workspace_id IS NOT NULL)
);

CREATE INDEX idx_user_active_workspace_user_id ON public.user_active_workspace(user_id);
CREATE INDEX idx_user_active_workspace_workspace_id ON public.user_active_workspace(workspace_id);
CREATE INDEX idx_user_active_workspace_updated_at ON public.user_active_workspace(updated_at DESC);

-- RLS Policy: Users can only view their own active workspace
CREATE POLICY user_active_workspace_select ON public.user_active_workspace
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert/update their own active workspace
-- AND they must be members of the target workspace
CREATE POLICY user_active_workspace_insert_update ON public.user_active_workspace
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.user_id = auth.uid()
      AND workspace_members.workspace_id = user_active_workspace.workspace_id
    )
  );

-- For updates (user can update their own active workspace)
CREATE POLICY user_active_workspace_update ON public.user_active_workspace
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.user_id = auth.uid()
      AND workspace_members.workspace_id = user_active_workspace.workspace_id
    )
  );

-- RLS Policy: Users can only delete their own active workspace
CREATE POLICY user_active_workspace_delete ON public.user_active_workspace
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE public.user_active_workspace ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_active_workspace TO authenticated;
