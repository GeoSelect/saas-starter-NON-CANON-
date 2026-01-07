-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) DEFAULT 'community', -- References PLANS in lib/features
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users_workspaces junction table for team members
CREATE TABLE IF NOT EXISTS users_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member, viewer
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, workspace_id)
);

-- Create activity_logs table to track user actions
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL, -- login, data_accessed, feature_used, report_created, report_shared, report_downloaded
  action_description TEXT,
  metadata JSONB, -- Store additional context like feature_name, report_id, etc.
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL, -- activity_summary, data_export, analytics
  file_url TEXT, -- S3 or storage URL
  file_format VARCHAR(20), -- pdf, csv, json
  data_json JSONB, -- Raw report data
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shared_reports table for public sharing
CREATE TABLE IF NOT EXISTS shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  password_hash VARCHAR(255), -- Optional password protection
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means no expiration
  max_downloads INTEGER, -- NULL means unlimited
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, share_token)
);

-- Create indexes for better query performance
CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_users_workspaces_user_id ON users_workspaces(user_id);
CREATE INDEX idx_users_workspaces_workspace_id ON users_workspaces(workspace_id);
CREATE INDEX idx_activity_logs_workspace_id ON activity_logs(workspace_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_reports_workspace_id ON reports(workspace_id);
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_shared_reports_report_id ON shared_reports(report_id);
CREATE INDEX idx_shared_reports_share_token ON shared_reports(share_token);

-- Enable RLS (Row Level Security) for workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces: Users can see workspaces they own or are members of
CREATE POLICY "Users can view their workspaces" ON workspaces
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_workspaces
      WHERE users_workspaces.workspace_id = workspaces.id
      AND users_workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- RLS Policies for users_workspaces
CREATE POLICY "Users can view workspace members" ON users_workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_workspaces uw
      WHERE uw.workspace_id = users_workspaces.workspace_id
      AND uw.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage members" ON users_workspaces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = users_workspaces.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their workspace activity" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_workspaces
      WHERE users_workspaces.workspace_id = activity_logs.workspace_id
      AND users_workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity logs for their workspace" ON activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_workspaces
      WHERE users_workspaces.workspace_id = activity_logs.workspace_id
      AND users_workspaces.user_id = auth.uid()
    )
  );

-- RLS Policies for reports
CREATE POLICY "Users can view workspace reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_workspaces
      WHERE users_workspaces.workspace_id = reports.workspace_id
      AND users_workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reports in their workspace" ON reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_workspaces
      WHERE users_workspaces.workspace_id = reports.workspace_id
      AND users_workspaces.user_id = auth.uid()
    )
  );

-- RLS Policies for shared_reports (public access via token)
CREATE POLICY "Public can access shared reports via token" ON shared_reports
  FOR SELECT USING (is_active = TRUE);
