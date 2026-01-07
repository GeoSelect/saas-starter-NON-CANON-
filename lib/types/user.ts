/**
 * CCP-00: User & Account Context Types
 *
 * These types represent the canonical shapes for user identity and account context.
 * All generated after CCP-00_ACCOUNT_CONTEXT_RESOLVE.
 */

// ---- User Profile (Front-End Canonical Shape) ----
export type UserProfile = {
  // ---- Identity ----
  user_id: string; // UUID (stable across workspaces)
  display_name: string; // "Peter Lawson"
  email: string; // primary identifier
  avatar_url?: string; // optional, rarely critical

  // ---- Operator Role ----
  role: "property_manager" | "admin" | "staff" | "viewer";
  title?: string; // "HOA Superintendent"
  organization_name?: string; // "Telluride Ski Ranches HOA"

  // ---- Workspace Context ----
  active_workspace_id: string; // HOA / portfolio container
  workspace_role: "owner" | "manager" | "editor" | "viewer";

  // ---- Entitlements (UI-critical) ----
  entitlements: {
    can_resolve_parcels: boolean;
    can_create_reports: boolean;
    can_share_reports: boolean;
    can_view_audit_log: boolean;
    can_manage_contacts: boolean;
  };

  // ---- Operational Defaults ----
  preferences: {
    default_map_view?: "satellite" | "streets" | "terrain";
    default_report_type?: "Parcel IQ HOA";
    show_sources_expanded?: boolean;
    mobile_first?: boolean;
  };

  // ---- Activity Signals (UI Hints, Not Analytics) ----
  activity: {
    last_login_at: string; // ISO
    last_parcel_viewed?: string; // parcel_id
    last_report_created_at?: string;
  };

  // ---- Status & Trust ----
  status: {
    is_active: boolean;
    is_verified: boolean;
    requires_reauth?: boolean;
  };
};

// ---- Internal Database Shapes ----

export type User = {
  id: string; // UUID
  email: string;
  display_name: string;
  avatar_url?: string;
  role: "property_manager" | "admin" | "staff" | "viewer";
  title?: string;
  is_active: boolean;
  is_verified: boolean;
  requires_reauth: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  metadata?: Record<string, any>;
};

export type Workspace = {
  id: string; // UUID
  organization_name: string;
  organization_type: "hoa" | "portfolio" | "management_company";
  primary_contact_email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
};

export type WorkspaceMembership = {
  id: string; // UUID
  user_id: string;
  workspace_id: string;
  workspace_role: "owner" | "manager" | "editor" | "viewer";
  can_resolve_parcels: boolean;
  can_create_reports: boolean;
  can_share_reports: boolean;
  can_view_audit_log: boolean;
  can_manage_contacts: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserPreferences = {
  id: string; // UUID
  user_id: string;
  default_map_view: "satellite" | "streets" | "terrain";
  default_report_type: string;
  show_sources_expanded: boolean;
  mobile_first: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
};

export type UserActivity = {
  id: string; // UUID
  user_id: string;
  workspace_id: string;
  activity_type: string; // 'parcel_viewed', 'report_created', etc.
  resource_id?: string; // parcel_id, report_id, etc.
  resource_type?: string; // 'parcel', 'report', 'contact', etc.
  metadata?: Record<string, any>;
  created_at: string;
};

// ---- Account Context Response (API) ----

export type AccountContextResponse = {
  success: boolean;
  data?: UserProfile;
  error?: {
    code: string;
    message: string;
  };
};

// ---- API Request/Response Types ----

export type GetAccountContextRequest = {
  // Can be empty (uses auth context) or include:
  workspace_id?: string; // if switching workspaces
};

export type UpdateUserProfileRequest = Partial<Pick<UserProfile, "display_name" | "avatar_url">>;

export type UpdatePreferencesRequest = Partial<UserPreferences>;
