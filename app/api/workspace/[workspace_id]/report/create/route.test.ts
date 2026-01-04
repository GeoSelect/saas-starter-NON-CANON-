import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';

// ============================================================================
// CCP-06: Workspace Report Create Endpoint Tests
// Contract: frozen (see docs/ccp/CCP-06_BRANDED_REPORT.md)
// Audit: success-only
// ============================================================================

// Mock NextRequest helper
function makeReq(
  body: unknown,
  workspaceId: string,
  accountId?: string
) {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  if (accountId) {
    headers.set('x-account-id', accountId);
  }

  return new Request(
    `http://localhost:3000/api/workspace/${workspaceId}/report/create`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  ) as any; // Cast to bypass NextRequest type
}

// Reset audit events before each test
beforeEach(() => {
  if (globalThis.__AUDIT_EVENTS) {
    globalThis.__AUDIT_EVENTS.length = 0;
  }
});

describe('POST /api/workspace/:workspace_id/report/create', () => {
  const validWorkspaceId = '550e8400-e29b-41d4-a716-446655440000';
  const validParcelContext = {
    parcel_id: 'parcel-001',
    lat: 39.7392,
    lng: -105.0844,
    intent: 'assessment',
    source: 'manual',
  };

  describe('Contract Validation (Frozen)', () => {
    it('should enforce authentication (401 when missing account_id)', async () => {
      const req = makeReq(
        { parcel_context: validParcelContext },
        validWorkspaceId
      );

      const response = await POST(req, { params: { workspace_id: validWorkspaceId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toMatchObject({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    });

    it('should validate workspace_id format (400 when invalid UUID)', async () => {
      const req = makeReq(
        { parcel_context: validParcelContext },
        'invalid-workspace-id',
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: 'invalid-workspace-id' },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: 'validation_error',
        message: 'Invalid workspace ID format',
      });
    });

    it('should validate parcel_context (400 when missing)', async () => {
      const req = makeReq({ report_name: 'Test' }, validWorkspaceId, 'test-account-id');

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('validation_error');
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'parcel_context' }),
        ])
      );
    });

    it('should validate parcel_context fields (400 when incomplete)', async () => {
      const req = makeReq(
        {
          parcel_context: {
            parcel_id: 'parcel-001',
            // missing lat, lng, intent, source
          },
        },
        validWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('validation_error');
    });

    it('should validate report_name max length (400 when > 255 chars)', async () => {
      const req = makeReq(
        {
          parcel_context: validParcelContext,
          report_name: 'a'.repeat(256),
        },
        validWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('validation_error');
    });
  });

  describe('Success Path (Stub Implementation)', () => {
    it('should return frozen contract response shape (201)', async () => {
      const req = makeReq(
        {
          parcel_context: validParcelContext,
          report_name: 'Sample Report',
        },
        validWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      // Assert frozen contract response shape
      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        report: {
          id: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          ),
          workspace_id: validWorkspaceId,
          name: 'Sample Report',
          status: 'draft',
          projection: {
            parcel_id: 'parcel-001',
            location: { lat: 39.7392, lng: -105.0844 },
            intent: 'assessment',
          },
          branding: {
            workspace_name: expect.any(String),
          },
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
      });
    });

    it('should auto-generate report_name when omitted', async () => {
      const req = makeReq(
        { parcel_context: validParcelContext },
        validWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.report.name).toMatch(/^Report \d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('DoD: Frozen Response Shapes', () => {
    it('should include all required fields in response', async () => {
      const req = makeReq(
        { parcel_context: validParcelContext },
        validWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.report).toHaveProperty('id');
      expect(data.report).toHaveProperty('workspace_id');
      expect(data.report).toHaveProperty('name');
      expect(data.report).toHaveProperty('status');
      expect(data.report).toHaveProperty('projection');
      expect(data.report).toHaveProperty('branding');
      expect(data.report).toHaveProperty('created_at');
      expect(data.report).toHaveProperty('updated_at');
    });

    it('should project parcel context correctly', async () => {
      const req = makeReq(
        { parcel_context: validParcelContext },
        validWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });
      const data = await response.json();

      expect(data.report.projection).toEqual({
        parcel_id: 'parcel-001',
        location: { lat: 39.7392, lng: -105.0844 },
        intent: 'assessment',
      });
    });
  });

  describe('Audit Emission (Success-Only)', () => {
    it('should emit report.created event on success', async () => {
      if (globalThis.__AUDIT_EVENTS) {
        globalThis.__AUDIT_EVENTS.length = 0;
      }

      const req = makeReq(
        {
          parcel_context: validParcelContext,
          report_name: 'Audit Test Report',
        },
        validWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });

      expect(response.status).toBe(201);
      if (globalThis.__AUDIT_EVENTS) {
        const events = globalThis.__AUDIT_EVENTS.filter(
          (e: any) => e.event_type === 'report.created'
        );
        expect(events.length).toBeGreaterThan(0);
        expect(events[0]).toMatchObject({
          event_type: 'report.created',
          workspace_id: validWorkspaceId,
          resource_type: 'report',
          action: 'create',
        });
      }
    });

    it('should NOT emit audit event on validation failure (success-only)', async () => {
      const req = makeReq(
        { parcel_context: {} },
        validWorkspaceId,
        'test-account-id'
      );
      await POST(req, { params: { workspace_id: validWorkspaceId } });

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const reportEvents = events.filter((e: any) =>
        e.event_type?.startsWith('report.')
      );
      expect(reportEvents).toHaveLength(0);
    });

    it('should NOT emit audit event on authentication failure (success-only)', async () => {
      const req = makeReq({ parcel_context: validParcelContext }, validWorkspaceId);
      await POST(req, { params: { workspace_id: validWorkspaceId } });

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const reportEvents = events.filter((e: any) =>
        e.event_type?.startsWith('report.')
      );
      expect(reportEvents).toHaveLength(0);
    });
  });

  describe('Membership & Role Enforcement (Frozen Contract)', () => {
    it('should emit report.created event on success', async () => {
      const req = makeReq(
        { parcel_context: validParcelContext, report_name: 'Success Report' },
        validWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });

      expect(response.status).toBe(201);
      // Verify audit event was emitted
      if (globalThis.__AUDIT_EVENTS) {
        const events = globalThis.__AUDIT_EVENTS.filter(
          (e: any) => e.event_type === 'report.created'
        );
        expect(events.length).toBeGreaterThan(0);
        expect(events[0]).toMatchObject({
          event_type: 'report.created',
          resource_type: 'report',
          action: 'create',
        });
      }
    });

    it('should return 403 forbidden when account is not workspace member', async () => {
      const req = makeReq(
        { parcel_context: validParcelContext },
        validWorkspaceId,
        'non-member-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('forbidden');
    });

    it('should return 403 forbidden when account lacks admin role', async () => {
      const req = makeReq(
        { parcel_context: validParcelContext },
        validWorkspaceId,
        'member-account-id'
      );

      const response = await POST(req, {
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
        { parcel_context: validParcelContext },
        nonExistentWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: nonExistentWorkspaceId },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('not_found');
    });

    it('should return 409 conflict when report name exists in workspace', async () => {
      const req = makeReq(
        {
          parcel_context: validParcelContext,
          report_name: 'Existing Report',
        },
        validWorkspaceId,
        'test-account-id'
      );

      const response = await POST(req, {
        params: { workspace_id: validWorkspaceId },
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe('conflict');
    });
  });
});
