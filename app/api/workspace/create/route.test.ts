import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';

// ============================================================================
// CCP-05: Workspace Create Endpoint Tests
// Contract: frozen (see docs/api/workspace_contracts.md)
// Audit: success-only
// ============================================================================

// Mock NextRequest helper
function makeReq(body: unknown, accountId?: string) {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  if (accountId) {
    headers.set('x-account-id', accountId);
  }

  return new Request('http://localhost:3000/api/workspace/create', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }) as any; // Cast to bypass NextRequest type
}

// Reset audit events before each test
beforeEach(() => {
  if (globalThis.__AUDIT_EVENTS) {
    globalThis.__AUDIT_EVENTS.length = 0;
  }
});

describe('POST /api/workspace/create', () => {
  describe('Contract Validation (Frozen)', () => {
    it('should enforce authentication (401 when missing account_id)', async () => {
      const req = makeReq({
        name: 'Test Workspace',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toMatchObject({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    });

    it('should validate required fields (400 when name missing)', async () => {
      const req = makeReq(
        {
          metadata: { foo: 'bar' },
        },
        'test-account-id'
      );

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: 'validation_error',
        message: 'Invalid request body',
      });
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            issue: expect.stringContaining('Required'),
          }),
        ])
      );
    });

    it('should validate name length (400 when name empty)', async () => {
      const req = makeReq(
        {
          name: '',
        },
        'test-account-id'
      );

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('validation_error');
    });

    it('should validate name max length (400 when name > 255 chars)', async () => {
      const req = makeReq(
        {
          name: 'a'.repeat(256),
        },
        'test-account-id'
      );

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('validation_error');
    });
  });

  describe('Success Path (Stub Implementation)', () => {
    it('should return frozen contract response shape (201)', async () => {
      const req = makeReq(
        {
          name: 'Test Workspace',
          metadata: { environment: 'test' },
        },
        'test-account-id'
      );

      const response = await POST(req);
      const data = await response.json();

      // Assert frozen contract response shape
      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        workspace: {
          id: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          ),
          name: 'Test Workspace',
          owner_account_id: 'test-account-id',
          metadata: { environment: 'test' },
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
        membership: {
          id: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          ),
          workspace_id: expect.any(String),
          account_id: 'test-account-id',
          role: 'owner',
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
      });
    });

    it('should default metadata to empty object when omitted', async () => {
      const req = makeReq(
        {
          name: 'Minimal Workspace',
        },
        'test-account-id'
      );

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.workspace.metadata).toEqual({});
    });
  });

  describe('DoD: Creator is Owner Deterministically', () => {
    it('should set owner_account_id to authenticated account', async () => {
      const accountId = 'deterministic-account-id';
      const req = makeReq(
        {
          name: 'Owner Test Workspace',
        },
        accountId
      );

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.workspace.owner_account_id).toBe(accountId);
      expect(data.membership.account_id).toBe(accountId);
      expect(data.membership.role).toBe('owner');
    });
  });

  describe('Audit Emission (TODO: Implement)', () => {
    it.todo('should emit workspace.created event on success', async () => {
      // TODO: Wire up audit event emission in route handler
      // const req = makeReq({ name: 'Audit Test' }, 'test-account-id');
      // await POST(req);
      // expect(globalThis.__AUDIT_EVENTS).toContainEqual(
      //   expect.objectContaining({
      //     event_type: 'workspace.created',
      //     workspace_id: expect.any(String),
      //     account_id: 'test-account-id',
      //   })
      // );
    });

    it('should NOT emit audit event on validation failure (success-only)', async () => {
      const req = makeReq({ name: '' }, 'test-account-id');
      await POST(req);

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const workspaceEvents = events.filter((e: any) =>
        e.event_type?.startsWith('workspace.')
      );
      expect(workspaceEvents).toHaveLength(0);
    });

    it('should NOT emit audit event on authentication failure (success-only)', async () => {
      const req = makeReq({ name: 'Test' }); // No account_id
      await POST(req);

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const workspaceEvents = events.filter((e: any) =>
        e.event_type?.startsWith('workspace.')
      );
      expect(workspaceEvents).toHaveLength(0);
    });
  });

  describe('Error Shapes (Frozen Contract)', () => {
    it.todo('should return 409 conflict when workspace name exists', async () => {
      // TODO: Implement name conflict check in route handler
      // 1. Create workspace with name "Duplicate"
      // 2. Attempt to create another workspace with same name and account_id
      // 3. Assert 409 response with frozen error shape
    });

    it.todo(
      'should return 403 forbidden when account lacks permission',
      async () => {
        // TODO: Implement entitlement/quota checks in route handler
        // This is a placeholder for future CCP-09 (entitlement enforcement)
      }
    );
  });
});
