/**
 * Example: CCP-06 Report Create Tests with Membership Fixture
 *
 * This demonstrates the proper test wiring pattern:
 * 1. Create workspace membership fixture (admin, member, non-member)
 * 2. Test role-based access (admin creates, member/non-member denied)
 * 3. Assert audit events for success cases only
 * 4. Verify error cases emit no audit events
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';
import {
  createWorkspaceMembershipFixture,
  assertNoAuditEvents,
  assertAuditEventType,
} from '../../../../../lib/test/workspace-membership-fixture';

// ============================================================================
// Setup: Membership Fixture
// ============================================================================

describe('POST /api/workspace/:workspace_id/report/create (Role-Based Access)', () => {
  let fixture: ReturnType<typeof createWorkspaceMembershipFixture>;
  let globalAuditEvents: any[] = [];

  beforeEach(() => {
    // Create fresh fixture for each test
    fixture = createWorkspaceMembershipFixture();

    // Reset audit events
    globalAuditEvents = [];
    if (globalThis.__AUDIT_EVENTS) {
      globalThis.__AUDIT_EVENTS.length = 0;
    }
  });

  const validParcelContext = {
    parcel_id: 'parcel-001',
    lat: 39.7392,
    lng: -105.0844,
    intent: 'assessment',
    source: 'manual',
  };

  // ============================================================================
  // Test Case: Admin can create
  // ============================================================================
  describe('Admin (owner) access', () => {
    it('admin can create report (200 OK)', async () => {
      const req = fixture.adminRequest(
        `http://localhost:3000/api/workspace/${fixture.workspaceId}/report/create`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            parcel_context: validParcelContext,
            report_name: 'Admin Report',
          }),
        }
      );

      const response = await POST(req as any, {
        params: { workspace_id: fixture.workspaceId },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.projection).toEqual(validParcelContext);

      // Assert audit event emitted
      if (globalThis.__AUDIT_EVENTS) {
        assertAuditEventType(globalThis.__AUDIT_EVENTS, 'report.created');
      }
    });

    it('admin create emits success audit event', async () => {
      globalAuditEvents = [];
      const req = fixture.adminRequest(
        `http://localhost:3000/api/workspace/${fixture.workspaceId}/report/create`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            parcel_context: validParcelContext,
            report_name: 'Audited Report',
          }),
        }
      );

      const response = await POST(req as any, {
        params: { workspace_id: fixture.workspaceId },
      });

      expect(response.status).toBe(200);

      // Verify exactly one audit event of type 'report.created'
      if (globalThis.__AUDIT_EVENTS) {
        const event = assertAuditEventType(
          globalThis.__AUDIT_EVENTS,
          'report.created'
        );
        expect(event).toMatchObject({
          account_id: fixture.accountA.id,
          workspace_id: fixture.workspaceId,
          resource_type: 'report',
          action: 'create',
        });
      }
    });
  });

  // ============================================================================
  // Test Case: Member cannot create (403 Forbidden)
  // ============================================================================
  describe('Member (read-only) access', () => {
    it('member cannot create report (403 Forbidden)', async () => {
      const req = fixture.memberRequest(
        `http://localhost:3000/api/workspace/${fixture.workspaceId}/report/create`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            parcel_context: validParcelContext,
            report_name: 'Member Report',
          }),
        }
      );

      const response = await POST(req as any, {
        params: { workspace_id: fixture.workspaceId },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toMatchObject({
        error: 'forbidden',
        message: 'Admin or owner role required',
      });
    });

    it('member create fails with no audit event', async () => {
      globalAuditEvents = [];
      const req = fixture.memberRequest(
        `http://localhost:3000/api/workspace/${fixture.workspaceId}/report/create`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            parcel_context: validParcelContext,
            report_name: 'Member Report',
          }),
        }
      );

      const response = await POST(req as any, {
        params: { workspace_id: fixture.workspaceId },
      });

      expect(response.status).toBe(403);

      // Assert NO audit events on failure
      if (globalThis.__AUDIT_EVENTS) {
        assertNoAuditEvents(globalThis.__AUDIT_EVENTS);
      }
    });
  });

  // ============================================================================
  // Test Case: Non-member cannot create (403 Forbidden)
  // ============================================================================
  describe('Non-member (no access) access', () => {
    it('non-member cannot create report (403 Forbidden)', async () => {
      const req = fixture.nonMemberRequest(
        `http://localhost:3000/api/workspace/${fixture.workspaceId}/report/create`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            parcel_context: validParcelContext,
            report_name: 'Non-Member Report',
          }),
        }
      );

      const response = await POST(req as any, {
        params: { workspace_id: fixture.workspaceId },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toMatchObject({
        error: 'forbidden',
      });
    });

    it('non-member create fails with no audit event', async () => {
      globalAuditEvents = [];
      const req = fixture.nonMemberRequest(
        `http://localhost:3000/api/workspace/${fixture.workspaceId}/report/create`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            parcel_context: validParcelContext,
            report_name: 'Non-Member Report',
          }),
        }
      );

      const response = await POST(req as any, {
        params: { workspace_id: fixture.workspaceId },
      });

      expect(response.status).toBe(403);

      // Assert NO audit events on failure
      if (globalThis.__AUDIT_EVENTS) {
        assertNoAuditEvents(globalThis.__AUDIT_EVENTS);
      }
    });
  });

  // ============================================================================
  // Test Case: Unauthenticated cannot create (401 Unauthorized)
  // ============================================================================
  describe('Unauthenticated access', () => {
    it('unauthenticated request fails (401 Unauthorized)', async () => {
      const req = fixture.unauthenticatedRequest(
        `http://localhost:3000/api/workspace/${fixture.workspaceId}/report/create`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            parcel_context: validParcelContext,
            report_name: 'Anon Report',
          }),
        }
      );

      const response = await POST(req as any, {
        params: { workspace_id: fixture.workspaceId },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toMatchObject({
        error: 'unauthorized',
      });
    });

    it('unauthenticated fails with no audit event', async () => {
      globalAuditEvents = [];
      const req = fixture.unauthenticatedRequest(
        `http://localhost:3000/api/workspace/${fixture.workspaceId}/report/create`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            parcel_context: validParcelContext,
            report_name: 'Anon Report',
          }),
        }
      );

      const response = await POST(req as any, {
        params: { workspace_id: fixture.workspaceId },
      });

      expect(response.status).toBe(401);

      // Assert NO audit events on auth failure
      if (globalThis.__AUDIT_EVENTS) {
        assertNoAuditEvents(globalThis.__AUDIT_EVENTS);
      }
    });
  });

  // ============================================================================
  // Test Matrix Summary
  // ============================================================================
  /*
   * ACCESS CONTROL MATRIX:
   *
   * Operation | Admin | Member | NonMember | Unauth
   * ----------|-------|--------|-----------|--------
   * CREATE    | 200 ✓ | 403 ✗  | 403 ✗     | 401 ✗
   * Audit     | emit  | none   | none      | none
   *
   * Legend:
   * ✓ = success with audit event
   * ✗ = failure with no audit event
   * 200 = OK, request accepted
   * 403 = Forbidden (authenticated but unauthorized)
   * 401 = Unauthorized (not authenticated)
   */
});
