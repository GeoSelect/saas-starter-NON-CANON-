/**
 * Test Fixture: Workspace Membership Seed Matrix
 *
 * Creates minimal but complete seed data for testing workspace-scoped endpoints:
 * - User A (admin): workspace owner with write access
 * - User B (member): workspace member with read-only access
 * - User C (non-member): no workspace access
 *
 * Pattern:
 * 1. Create auth.users entries (mocked in tests)
 * 2. Create accounts (workspace ownership/metadata)
 * 3. Link user→account (account_users)
 * 4. Create workspace owned by user A
 * 5. Create workspace_members for A (owner) and B (member)
 * 6. User C has account but no workspace membership
 *
 * Usage:
 *   const fixture = await createWorkspaceMembershipFixture(db)
 *   // fixture.userA, fixture.userB, fixture.userC
 *   // fixture.accountA, fixture.accountB, fixture.accountC
 *   // fixture.workspaceId
 *   // fixture.adminRequest(), fixture.memberRequest(), fixture.nonMemberRequest()
 */

import { v4 as uuidv4 } from 'uuid';

export interface WorkspaceMembershipFixture {
  // Auth users (mocked in tests)
  userA: { id: string; email: string };
  userB: { id: string; email: string };
  userC: { id: string; email: string };

  // Accounts
  accountA: { id: string };
  accountB: { id: string };
  accountC: { id: string };

  // Workspace (owned by accountA)
  workspaceId: string;

  // Test helpers
  adminRequest: (url: string, options?: RequestInit) => Request;
  memberRequest: (url: string, options?: RequestInit) => Request;
  nonMemberRequest: (url: string, options?: RequestInit) => Request;
  unauthenticatedRequest: (url: string, options?: RequestInit) => Request;
}

/**
 * Create a complete workspace membership fixture
 * In real tests, this would use actual DB inserts; in unit tests, it's mocked
 */
export function createWorkspaceMembershipFixture(): WorkspaceMembershipFixture {
  const userA = { id: uuidv4(), email: 'admin@example.com' };
  const userB = { id: uuidv4(), email: 'member@example.com' };
  const userC = { id: uuidv4(), email: 'outsider@example.com' };

  const accountA = { id: uuidv4() };
  const accountB = { id: uuidv4() };
  const accountC = { id: uuidv4() };

  const workspaceId = uuidv4();

  // Helper to create authenticated request
  const createAuthRequest = (accountId: string, role?: string) => {
    return (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      headers.set('x-account-id', accountId);
      if (role) {
        headers.set('x-workspace-role', role);
      }
      return new Request(url, { ...options, headers });
    };
  };

  return {
    userA,
    userB,
    userC,
    accountA,
    accountB,
    accountC,
    workspaceId,
    adminRequest: createAuthRequest(accountA.id, 'admin'),
    memberRequest: createAuthRequest(accountB.id, 'member'),
    nonMemberRequest: createAuthRequest(accountC.id), // no role = non-member
    unauthenticatedRequest: (url: string, options: RequestInit = {}) => {
      return new Request(url, options);
    },
  };
}

/**
 * Test case template: membership-based access control
 *
 * Usage:
 *   describe('POST /api/workspace/:id/report/create', () => {
 *     it('admin can create', async () => {
 *       const fixture = createWorkspaceMembershipFixture();
 *       const req = fixture.adminRequest(url, { method: 'POST', body: ... });
 *       const res = await handler(req);
 *       expect(res.status).toBe(200);
 *       // Assert audit event emitted
 *     });
 *
 *     it('member cannot create (403)', async () => {
 *       const fixture = createWorkspaceMembershipFixture();
 *       const req = fixture.memberRequest(url, { method: 'POST', body: ... });
 *       const res = await handler(req);
 *       expect(res.status).toBe(403);
 *       // Assert NO audit events
 *     });
 *
 *     it('non-member cannot create (403)', async () => {
 *       const fixture = createWorkspaceMembershipFixture();
 *       const req = fixture.nonMemberRequest(url, { method: 'POST', body: ... });
 *       const res = await handler(req);
 *       expect(res.status).toBe(403);
 *       // Assert NO audit events
 *     });
 *   });
 */

/**
 * Audit event assertion helpers
 */
export function assertNoAuditEvents(events: any[]) {
  if (events.length > 0) {
    throw new Error(
      `Expected no audit events on failure, but got ${events.length}: ${JSON.stringify(events)}`
    );
  }
}

export function assertAuditEventType(events: any[], expectedType: string) {
  const matching = events.filter((e) => e.event_type === expectedType);
  if (matching.length === 0) {
    throw new Error(
      `Expected audit event of type "${expectedType}", but got: ${JSON.stringify(events)}`
    );
  }
  if (matching.length > 1) {
    throw new Error(
      `Expected 1 audit event of type "${expectedType}", but got ${matching.length}: ${JSON.stringify(matching)}`
    );
  }
  return matching[0];
}

/**
 * Test matrix template: all roles, all operations
 *
 * This is a reference for what tests should cover:
 *
 * POST /api/workspace/:id/report/create
 *   Admin    → 200 OK              (audit: report.created)
 *   Member   → 403 Forbidden        (audit: none)
 *   NonMember→ 403 Forbidden        (audit: none)
 *   Unauth   → 401 Unauthorized     (audit: none)
 *
 * GET /api/workspace/:id/reports
 *   Admin    → 200 OK              (audit: reports.listed)
 *   Member   → 200 OK              (audit: reports.listed)
 *   NonMember→ 403 Forbidden        (audit: none)
 *   Unauth   → 401 Unauthorized     (audit: none)
 *
 * GET /api/workspace/:id/report/:report_id
 *   Admin    → 200 OK              (audit: report.retrieved)
 *   Member   → 200 OK              (audit: report.retrieved)
 *   NonMember→ 403 or 404 Forbidden (audit: none)
 *   Unauth   → 401 Unauthorized     (audit: none)
 */
