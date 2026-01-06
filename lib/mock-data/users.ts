/**
 * Mock User Data for Development
 * Use this data when database tables are not yet created
 */

export const mockUsers = [
  {
    id: "user-001",
    email: "peter@geoselect.com",
    displayName: "Peter Johnson",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=peter",
    role: "admin",
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date("2026-01-05T10:30:00Z"),
    createdAt: new Date("2025-06-15T08:00:00Z"),
  },
  {
    id: "user-002",
    email: "sarah@geoselect.com",
    displayName: "Sarah Chen",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    role: "member",
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date("2026-01-04T14:20:00Z"),
    createdAt: new Date("2025-07-20T09:30:00Z"),
  },
  {
    id: "user-003",
    email: "michael@geoselect.com",
    displayName: "Michael Rodriguez",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
    role: "member",
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date("2026-01-03T16:45:00Z"),
    createdAt: new Date("2025-08-10T11:00:00Z"),
  },
  {
    id: "user-004",
    email: "emma@geoselect.com",
    displayName: "Emma Wilson",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    role: "viewer",
    isActive: true,
    isVerified: false,
    lastLoginAt: new Date("2025-12-28T13:15:00Z"),
    createdAt: new Date("2025-10-05T07:45:00Z"),
  },
  {
    id: "user-005",
    email: "james@geoselect.com",
    displayName: "James Thompson",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    role: "member",
    isActive: false,
    isVerified: true,
    lastLoginAt: new Date("2025-12-15T11:20:00Z"),
    createdAt: new Date("2025-09-12T10:00:00Z"),
  },
  {
    id: "user-006",
    email: "lisa@geoselect.com",
    displayName: "Lisa Anderson",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
    role: "admin",
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date("2026-01-02T09:50:00Z"),
    createdAt: new Date("2025-05-22T08:30:00Z"),
  },
  {
    id: "user-007",
    email: "david@geoselect.com",
    displayName: "David Kumar",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    role: "member",
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date("2026-01-05T08:15:00Z"),
    createdAt: new Date("2025-11-30T14:00:00Z"),
  },
  {
    id: "user-008",
    email: "rachel@geoselect.com",
    displayName: "Rachel Martinez",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=rachel",
    role: "viewer",
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date("2026-01-04T15:30:00Z"),
    createdAt: new Date("2025-12-01T12:45:00Z"),
  },
];

/**
 * Find user by ID
 */
export function getMockUserById(id: string) {
  return mockUsers.find((user) => user.id === id);
}

/**
 * Find user by email
 */
export function getMockUserByEmail(email: string) {
  return mockUsers.find((user) => user.email === email.toLowerCase());
}

/**
 * Get all active users
 */
export function getActiveMockUsers() {
  return mockUsers.filter((user) => user.isActive);
}

/**
 * Get all verified users
 */
export function getVerifiedMockUsers() {
  return mockUsers.filter((user) => user.isVerified);
}

/**
 * Get users by role
 */
export function getMockUsersByRole(role: "admin" | "member" | "viewer") {
  return mockUsers.filter((user) => user.role === role);
}

/**
 * Search users by name or email
 */
export function searchMockUsers(query: string) {
  const lowerQuery = query.toLowerCase();
  return mockUsers.filter(
    (user) =>
      user.displayName.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
  );
}
