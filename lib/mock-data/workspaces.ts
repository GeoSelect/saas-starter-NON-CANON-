/**
 * Mock Workspace Data for Development
 * Use this data when database tables are not yet created
 */

export const mockWorkspaces = [
  {
    id: "workspace-001",
    organizationName: "GeoSelect Team",
    organizationType: "SaaS",
    isActive: true,
    createdAt: new Date("2025-06-01T08:00:00Z"),
    updatedAt: new Date("2026-01-05T10:00:00Z"),
  },
  {
    id: "workspace-002",
    organizationName: "Real Estate Partners LLC",
    organizationType: "Real Estate",
    isActive: true,
    createdAt: new Date("2025-08-15T09:30:00Z"),
    updatedAt: new Date("2026-01-04T14:00:00Z"),
  },
  {
    id: "workspace-003",
    organizationName: "Urban Development Corp",
    organizationType: "Development",
    isActive: true,
    createdAt: new Date("2025-10-20T11:00:00Z"),
    updatedAt: new Date("2026-01-03T16:00:00Z"),
  },
  {
    id: "workspace-004",
    organizationName: "Mountain Properties Consulting",
    organizationType: "Consulting",
    isActive: false,
    createdAt: new Date("2025-07-10T07:45:00Z"),
    updatedAt: new Date("2025-12-15T13:00:00Z"),
  },
];

/**
 * Mock workspace memberships (linking users to workspaces)
 */
export const mockWorkspaceMemberships = [
  {
    userId: "user-001",
    workspaceId: "workspace-001",
    workspaceRole: "owner",
    canResolveParcels: true,
    canCreateReports: true,
    canShareReports: true,
    canViewAuditLog: true,
    canManageContacts: true,
    createdAt: new Date("2025-06-01T08:00:00Z"),
  },
  {
    userId: "user-002",
    workspaceId: "workspace-001",
    workspaceRole: "admin",
    canResolveParcels: true,
    canCreateReports: true,
    canShareReports: true,
    canViewAuditLog: true,
    canManageContacts: false,
    createdAt: new Date("2025-07-20T09:30:00Z"),
  },
  {
    userId: "user-003",
    workspaceId: "workspace-001",
    workspaceRole: "member",
    canResolveParcels: true,
    canCreateReports: true,
    canShareReports: false,
    canViewAuditLog: false,
    canManageContacts: false,
    createdAt: new Date("2025-08-10T11:00:00Z"),
  },
  {
    userId: "user-004",
    workspaceId: "workspace-001",
    workspaceRole: "viewer",
    canResolveParcels: false,
    canCreateReports: false,
    canShareReports: false,
    canViewAuditLog: false,
    canManageContacts: false,
    createdAt: new Date("2025-10-05T07:45:00Z"),
  },
  {
    userId: "user-005",
    workspaceId: "workspace-002",
    workspaceRole: "owner",
    canResolveParcels: true,
    canCreateReports: true,
    canShareReports: true,
    canViewAuditLog: true,
    canManageContacts: true,
    createdAt: new Date("2025-08-15T09:30:00Z"),
  },
  {
    userId: "user-006",
    workspaceId: "workspace-002",
    workspaceRole: "admin",
    canResolveParcels: true,
    canCreateReports: true,
    canShareReports: true,
    canViewAuditLog: true,
    canManageContacts: true,
    createdAt: new Date("2025-05-22T08:30:00Z"),
  },
  {
    userId: "user-001",
    workspaceId: "workspace-002",
    workspaceRole: "member",
    canResolveParcels: true,
    canCreateReports: true,
    canShareReports: false,
    canViewAuditLog: false,
    canManageContacts: false,
    createdAt: new Date("2025-09-10T10:00:00Z"),
  },
];

/**
 * Get workspace by ID
 */
export function getMockWorkspaceById(id: string) {
  return mockWorkspaces.find((workspace) => workspace.id === id);
}

/**
 * Get all active workspaces
 */
export function getActiveMockWorkspaces() {
  return mockWorkspaces.filter((workspace) => workspace.isActive);
}

/**
 * Get workspaces for a user
 */
export function getMockWorkspacesForUser(userId: string) {
  const membershipIds = mockWorkspaceMemberships
    .filter((m) => m.userId === userId)
    .map((m) => m.workspaceId);

  return mockWorkspaces.filter((workspace) => membershipIds.includes(workspace.id));
}

/**
 * Get users in a workspace
 */
export function getMockWorkspaceMembers(workspaceId: string) {
  return mockWorkspaceMemberships.filter((m) => m.workspaceId === workspaceId);
}

/**
 * Get user's role in a workspace
 */
export function getMockUserWorkspaceRole(userId: string, workspaceId: string) {
  const membership = mockWorkspaceMemberships.find(
    (m) => m.userId === userId && m.workspaceId === workspaceId
  );
  return membership?.workspaceRole;
}

/**
 * Check if user has entitlement in workspace
 */
export function hasMockUserEntitlement(
  userId: string,
  workspaceId: string,
  entitlement: string
) {
  const membership = mockWorkspaceMemberships.find(
    (m) => m.userId === userId && m.workspaceId === workspaceId
  );

  if (!membership) return false;

  const entitlementMap: Record<string, boolean> = {
    can_resolve_parcels: membership.canResolveParcels,
    can_create_reports: membership.canCreateReports,
    can_share_reports: membership.canShareReports,
    can_view_audit_log: membership.canViewAuditLog,
    can_manage_contacts: membership.canManageContacts,
  };

  return entitlementMap[entitlement] || false;
}
