-- Create activities audit log table for tracking user actions across the happy path
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  request_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_workspace_id ON activities(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_user_workspace ON activities(user_id, workspace_id) WHERE workspace_id IS NOT NULL;

-- Idempotency: unique index on (workspace_id, activity_type, request_id) where request_id is NOT NULL
-- Prevents duplicate logging when retries occur with same request_id
-- Note: request_id IS NULL for activities logged without explicit idempotency tracking
CREATE UNIQUE INDEX idx_activities_idempotency 
  ON activities(workspace_id, activity_type, request_id) 
  WHERE request_id IS NOT NULL;

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own activities
CREATE POLICY "Users can view their own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Workspace members can view activities in their workspace
CREATE POLICY "Workspace members can view workspace activities"
  ON activities FOR SELECT
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = activities.workspace_id
      AND workspace_id = activities.workspace_id
      AND owner_id = auth.uid()
    )
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Application can insert activities (via service role in helper)
CREATE POLICY "Service role can insert activities"
  ON activities FOR INSERT
  WITH CHECK (true);
