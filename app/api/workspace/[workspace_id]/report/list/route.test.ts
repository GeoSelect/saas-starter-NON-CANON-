import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from './route';

// ============================================================================
// CCP-06: Workspace Report List Endpoint Tests
// Contract: frozen (see docs/ccp/CCP-06_BRANDED_REPORT.md)
// Audit: success-only
// ============================================================================

// Mock NextRequest helper
function makeReq(
  workspaceId: string,
  queryParams: Record<string, string> = {},
  accountId?: string
) {
  const url = new URL(
    `http://localhost:3000/api/workspace/${workspaceId}/report/list`
  );
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  if (accountId) {
    headers.set('x-account-id', accountId);
  }

  return new Request(url.toString(), {
    method: 'GET',
    headers,
  }) as any; // Cast to bypass NextRequest type
}

// Reset audit events before each test
beforeEach(() => {
  if (globalThis.__AUDIT_EVENTS) {
    globalThis.__AUDIT_EVENTS.length = 0;
  }
});

describe('GET /api/workspace/:workspace_id/report/list', () => {
  const validWorkspaceId = '550e8400-e29b-41d4-a716-446655440000';

  describe('Contract Validation (Frozen)', () => {
    it('should enforce authentication (401 when missing account_id)', async () => {
      const req = makeReq(validWorkspaceId);

      const response = await GET(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toMatchObject({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    });

    it('should validate workspace_id format (400 when invalid UUID)', async () => {
      const req = makeReq('invalid-workspace-id', {}, 'test-account-id');

      const response = await GET(req, {
        params: { workspace_id: 'invalid-workspace-id' },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: 'validation_error',
        message: 'Invalid workspace ID format',
      });
    });

    it('should validate page parameter (400 when page < 1)', async () => {
      const req = makeReq(validWorkspaceId, { page: '0' }, 'test-account-id');

      const response = await GET(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('validation_error');
    });

    it('should validate limit parameter (400 when limit > 100)', async () => {
      const req = makeReq(validWorkspaceId, { limit: '101' }, 'test-account-id');

      const response = await GET(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('validation_error');
    });

    it('should default page to 1 when omitted', async () => {
      const req = makeReq(validWorkspaceId, {}, 'test-account-id');

      const response = await GET(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1);
    });

    it('should default limit to 20 when omitted', async () => {
      const req = makeReq(validWorkspaceId, {}, 'test-account-id');

      const response = await GET(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(20);
    });
  });

  describe('Success Path (Stub Implementation)', () => {
    it('should return frozen contract response shape (200)', async () => {
      const req = makeReq(
        validWorkspaceId,
        { page: '1', limit: '10' },
        'test-account-id'
      );

      const response = await GET(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      // Assert frozen contract response shape
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        reports: expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            ),
            workspace_id: validWorkspaceId,
            name: expect.any(String),
            status: expect.stringMatching(/^(draft|published|archived)$/),
            created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          }),
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: expect.any(Number),
          total_pages: expect.any(Number),
        },
      });
    });

    it('should respect custom page and limit parameters', async () => {
      const req = makeReq(
        validWorkspaceId,
        { page: '2', limit: '50' },
        'test-account-id'
      );

      const response = await GET(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(50);
    });
  });

  describe('Audit Emission (Success-Only)', () => {
    it('should emit reports.listed event on success', async () => {
      if (globalThis.__AUDIT_EVENTS) {
        globalThis.__AUDIT_EVENTS.length = 0;
      }

      const req = makeReq(validWorkspaceId, {}, 'test-account-id');

      const response = await GET(req, {
        params: { workspace_id: validWorkspaceId },
      });

      expect(response.status).toBe(200);
      if (globalThis.__AUDIT_EVENTS) {
        const events = globalThis.__AUDIT_EVENTS.filter(
          (e: any) => e.event_type === 'reports.listed'
        );
        expect(events.length).toBeGreaterThan(0);
        expect(events[0]).toMatchObject({
          event_type: 'reports.listed',
          workspace_id: validWorkspaceId,
          resource_type: 'reports',
          action: 'list',
        });
      }
    });

    it('should NOT emit audit event on authentication failure (success-only)', async () => {
      const req = makeReq(validWorkspaceId);
      await GET(req, { params: { workspace_id: validWorkspaceId } });

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const reportEvents = events.filter((e: any) =>
        e.event_type?.startsWith('report')
      );
      expect(reportEvents).toHaveLength(0);
    });

    it('should NOT emit audit event on validation failure (success-only)', async () => {
      const req = makeReq(validWorkspaceId, { page: '-1' }, 'test-account-id');
      await GET(req, { params: { workspace_id: validWorkspaceId } });

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const reportEvents = events.filter((e: any) =>
        e.event_type?.startsWith('report')
      );
      expect(reportEvents).toHaveLength(0);
    });
  });

  describe('Membership Enforcement (Frozen Contract)', () => {
    it('should return 403 forbidden when account is not workspace member', async () => {
      const req = makeReq(
        validWorkspaceId,
        {},
        'non-member-account-id'
      );

      const response = await GET(req, {
        params: { workspace_id: validWorkspaceId },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('forbidden');
    });

    it('should return 404 when workspace does not exist', async () => {
      const nonExistentWorkspaceId =
        '00000000-0000-0000-0000-000000000000';
      const req = makeReq(
        nonExistentWorkspaceId,
        {},
        'test-account-id'
      );

      const response = await GET(req, {
        params: { workspace_id: nonExistentWorkspaceId },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('not_found');
    });
  });
});
