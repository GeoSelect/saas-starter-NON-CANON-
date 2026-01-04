export enum ActivityType {
  // Authentication events
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  // Team/Workspace events
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  // Happy path events
  PARCEL_SELECTED = 'PARCEL_SELECTED',
  RULES_EVALUATED = 'RULES_EVALUATED',
  SNAPSHOT_CREATED = 'SNAPSHOT_CREATED',
  REPORT_SHARED = 'REPORT_SHARED',
  SHARE_LINK_CREATED = 'SHARE_LINK_CREATED',
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  workspace_id?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
}
