import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import * as workspaceAccess from '@/lib/db/helpers/workspace-access';

// Mock workspace-access module
vi.mock('@/lib/db/helpers/workspace-access', () => ({
  checkWorkspaceMembership: vi.fn(),
}));

// ============================================================================
// CCP-06: Workspace Report Get Endpoint Tests
// Contract: frozen (see docs/ccp/CCP-06_BRANDED_REPORT.md)
// Audit: success-only
// ============================================================================

// Mock NextRequest helper
function makeReq(
  workspaceId: string,
  reportId: string,
  accountId?: string
) {
  const headers = new Headers();
  if (accountId) {
    headers.set('x-account-id', accountId);
  }

  return new Request(
    `http://localhost:3000/api/workspace/${workspaceId}/report/${reportId}`,
    {
      method: 'GET',
      headers,
    }
  ) as any; // Cast to bypass NextRequest type
}

// Reset audit events and mocks before each test
beforeEach(() => {
  if (globalThis.__AUDIT_EVENTS) {
    globalThis.__AUDIT_EVENTS.length = 0;
  }
  vi.clearAllMocks();
  // Default: mock returns member status (success path)
  vi.mocked(workspaceAccess.checkWorkspaceMembership).mockResolvedValue({
    isMember: true,
    role: 'member',
  } as any);
});

describe('GET /api/workspace/:workspace_id/report/:report_id', () => {
  const validWorkspaceId = '550e8400-e29b-41d4-a716-446655440000';
  const validReportId = '661f9511-f3ac-52e5-b827-557766553333';

  describe('Contract Validation (Frozen)', () => {
    it('should enforce authentication (401 when missing account_id)', async () => {
      const req = makeReq(validWorkspaceId, validReportId);

      const response = await GET(req, {
        params: {
          workspace_id: validWorkspaceId,
          report_id: validReportId,
        },
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toMatchObject({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    });

    it('should validate workspace_id format (400 when invalid UUID)', async () => {
      const req = makeReq('invalid-workspace-id', validReportId, 'test-account-id');

      const response = await GET(req, {
        params: {
          workspace_id: 'invalid-workspace-id',
          report_id: validReportId,
        },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: 'validation_error',
        message: 'Invalid workspace ID format',
      });
    });

    it('should validate report_id format (400 when invalid UUID)', async () => {
      const req = makeReq(validWorkspaceId, 'invalid-report-id', 'test-account-id');

      const response = await GET(req, {
        params: {
          workspace_id: validWorkspaceId,
          report_id: 'invalid-report-id',
        },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: 'validation_error',
        message: 'Invalid report ID format',
      });
    });
  });

  describe('Success Path (Stub Implementation)', () => {
    it('should return frozen contract response shape (200)', async () => {
      const req = makeReq(validWorkspaceId, validReportId, 'test-account-id');

      const response = await GET(req, {
        params: {
          workspace_id: validWorkspaceId,
          report_id: validReportId,
        },
      });
      const data = await response.json();

      // Assert frozen contract response shape
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        report: {
          id: validReportId,
          workspace_id: validWorkspaceId,
          name: expect.any(String),
          status: expect.stringMatching(/^(draft|published|archived)$/),
          projection: {
            parcel_id: expect.any(String),
            location: {
              lat: expect.any(Number),
              lng: expect.any(Number),
            },
            intent: expect.any(String),
          },
          branding: {
            workspace_name: expect.any(String),
          },
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
      });
    });

    it('should include all required fields in response', async () => {
      const req = makeReq(validWorkspaceId, validReportId, 'test-account-id');

      const response = await GET(req, {
        params: {
          workspace_id: validWorkspaceId,
          report_id: validReportId,
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.report).toHaveProperty('id');
      expect(data.report).toHaveProperty('workspace_id');
      expect(data.report).toHaveProperty('name');
      expect(data.report).toHaveProperty('status');
      expect(data.report).toHaveProperty('projection');
      expect(data.report).toHaveProperty('branding');
      expect(data.report).toHaveProperty('created_at');
      expect(data.report).toHaveProperty('updated_at');
    });
  });

  describe('Audit Emission (Success-Only)', () => {
    it('should emit report.retrieved event on success', async () => {
      if (globalThis.__AUDIT_EVENTS) {
        globalThis.__AUDIT_EVENTS.length = 0;
      }

      const req = makeReq(validWorkspaceId, validReportId, 'test-account-id');

      const response = await GET(req, {
        params: {
          workspace_id: validWorkspaceId,
          report_id: validReportId,
        },
      });

      expect(response.status).toBe(200);
      if (globalThis.__AUDIT_EVENTS) {
        const events = globalThis.__AUDIT_EVENTS.filter(
          (e: any) => e.event_type === 'report.retrieved'
        );
        expect(events.length).toBeGreaterThan(0);
        expect(events[0]).toMatchObject({
          event_type: 'report.retrieved',
          workspace_id: validWorkspaceId,
          resource_type: 'report',
          action: 'retrieve',
        });
      }
    });

    it('should NOT emit audit event on authentication failure (success-only)', async () => {
      const req = makeReq(validWorkspaceId, validReportId);
      await GET(req, {
        params: {
          workspace_id: validWorkspaceId,
          report_id: validReportId,
        },
      });

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const reportEvents = events.filter((e: any) =>
        e.event_type?.startsWith('report.')
      );
      expect(reportEvents).toHaveLength(0);
    });

    it('should NOT emit audit event on validation failure (success-only)', async () => {
      const req = makeReq(validWorkspaceId, 'invalid-id', 'test-account-id');
      await GET(req, {
        params: {
          workspace_id: validWorkspaceId,
          report_id: 'invalid-id',
        },
      });

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const reportEvents = events.filter((e: any) =>
        e.event_type?.startsWith('report.')
      );
      expect(reportEvents).toHaveLength(0);
    });
  });

  describe('Membership Enforcement (404 for Non-Members)', () => {
    it('should return 404 when account is not workspace member (hiding existence)', async () => {
      // Mock non-member status for this test
      vi.mocked(workspaceAccess.checkWorkspaceMembership).mockResolvedValueOnce({
        isMember: false,
      } as any);

      const req = makeReq(
        validWorkspaceId,
        validReportId,
        'non-member-account-id'
      );

      const response = await GET(req, {
        params: {
          workspace_id: validWorkspaceId,
          report_id: validReportId,
        },
      });

      // Returns 404 to hide report existence from non-members
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('not_found');
    });

    it('should return 404 when workspace does not exist', async () => {
      const nonExistentWorkspaceId =
        '00000000-0000-0000-0000-000000000000';
      const req = makeReq(
        nonExistentWorkspaceId,
        validReportId,
        'test-account-id'
      );

      const response = await GET(req, {
        params: {
          workspace_id: nonExistentWorkspaceId,
          report_id: validReportId,
        },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('not_found');
    });

    it('should return 404 when report does not exist', async () => {
      const nonExistentReportId =
        '00000000-0000-0000-0000-000000000000';
      const req = makeReq(
        validWorkspaceId,
        nonExistentReportId,
        'test-account-id'
      );

      const response = await GET(req, {
        params: {
          workspace_id: validWorkspaceId,
          report_id: nonExistentReportId,
        },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('not_found');
    });
  });
});
