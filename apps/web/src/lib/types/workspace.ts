// Workspace types and interfaces
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  owner_id: string;
  plan_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserWorkspace {
  id: string;
  user_id: string;
  workspace_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
}

export type ActivityActionType =
  | 'login'
  | 'data_accessed'
  | 'feature_used'
  | 'report_created'
  | 'report_shared'
  | 'report_downloaded'
  | 'user_invited'
  | 'settings_changed'
  | 'workspace_switch';

export interface ActivityLog {
  id: string;
  workspace_id: string;
  user_id?: string;
  action_type: ActivityActionType;
  action_description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type ReportType = 'activity_summary' | 'data_export' | 'analytics';
export type ReportFormat = 'pdf' | 'csv' | 'json';

export interface Report {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  description?: string;
  report_type: ReportType;
  file_url?: string;
  file_format?: ReportFormat;
  data_json?: Record<string, any>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedReport {
  id: string;
  report_id: string;
  share_token: string;
  shared_by: string;
  password_hash?: string;
  expires_at?: string;
  max_downloads?: number;
  download_count: number;
  is_active: boolean;
  created_at: string;
}

export interface WorkspaceStats {
  total_users: number;
  total_activity_logs: number;
  total_reports: number;
  shared_reports_count: number;
  last_activity?: string;
  active_members_today: number;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface CreateReportRequest {
  workspace_id: string;
  title: string;
  description?: string;
  report_type: ReportType;
  file_format?: ReportFormat;
  data?: Record<string, any>;
}

export interface ShareReportRequest {
  report_id: string;
  password?: string;
  expires_in_days?: number;
  max_downloads?: number;
}

export interface ActivityFilter {
  workspace_id: string;
  user_id?: string;
  action_type?: ActivityActionType;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
