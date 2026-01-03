import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from './route';

// ============================================================================
// CCP-05: Workspace Get Endpoint Tests
// Contract: frozen (see docs/api/workspace_contracts.md)
// Audit: success-only
// ============================================================================

// Mock NextRequest helper
function makeReq(workspaceId: string, accountId?: string) {
  const headers = new Headers();
  if (accountId) {
    headers.set('x-account-id', accountId);
  }

  return new Request(
    `http://localhost:3000/api/workspace/${workspaceId}`,
    {
      method: 'GET',
      headers,
    }
  ) as any; // Cast to bypass NextRequest type
}

// Reset audit events before each test
beforeEach(() => {
  if (globalThis.__AUDIT_EVENTS) {
    globalThis.__AUDIT_EVENTS.length = 0;
  }
});

describe('GET /api/workspace/:id', () => {
  describe('Contract Validation (Frozen)', () => {
    it('should enforce authentication (401 when missing account_id)', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const req = makeReq(validUuid);

      const response = await GET(req, { params: { id: validUuid } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toMatchObject({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    });

    it('should validate workspace ID format (400 when invalid UUID)', async () => {
      const invalidId = 'not-a-uuid';
      const req = makeReq(invalidId, 'test-account-id');

      const response = await GET(req, { params: { id: invalidId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: 'validation_error',
        message: 'Invalid workspace ID format',
      });
    });
  });

  describe('Success Path (Stub Implementation)', () => {
    it('should return frozen contract response shape (200)', async () => {
      const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
      const req = makeReq(workspaceId, 'test-account-id');

      const response = await GET(req, { params: { id: workspaceId } });
      const data = await response.json();

      // Assert frozen contract response shape
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        workspace: {
          id: workspaceId,
          name: expect.any(String),
          owner_account_id: 'test-account-id',
          metadata: expect.any(Object),
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
        members: expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            ),
            workspace_id: workspaceId,
            account_id: 'test-account-id',
            role: expect.stringMatching(/^(owner|admin|member)$/),
            created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          }),
        ]),
      });
    });
  });

  describe('DoD: Forbidden Access for Non-Members', () => {
    it.todo(
      'should return 403 forbidden when account is not a workspace member',
      async () => {
        // TODO: Implement RLS membership check in route handler
        // 1. Create workspace owned by account-A
        // 2. Attempt to GET as account-B (not a member)
        // 3. Assert 403 response with frozen error shape
        // const workspaceId = 'workspace-owned-by-other-account';
        // const req = makeReq(workspaceId, 'non-member-account-id');
        // const response = await GET(req, { params: { id: workspaceId } });
        // const data = await response.json();
        // expect(response.status).toBe(403);
        // expect(data).toMatchObject({
        //   error: 'forbidden',
        //   message: 'Access denied: not a workspace member',
        // });
      }
    );

    it.todo('should return 404 when workspace does not exist', async () => {
      // TODO: Implement database query in route handler
      // const nonExistentId = '00000000-0000-0000-0000-000000000000';
      // const req = makeReq(nonExistentId, 'test-account-id');
      // const response = await GET(req, { params: { id: nonExistentId } });
      // const data = await response.json();
      // expect(response.status).toBe(404);
      // expect(data).toMatchObject({
      //   error: 'not_found',
      //   message: 'Workspace not found',
      //   details: { workspace_id: nonExistentId },
      // });
    });
  });

  describe('Audit Emission (TODO: Implement)', () => {
    it.todo('should emit workspace.retrieved event on success', async () => {
      // TODO: Wire up audit event emission in route handler
      // const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
      // const req = makeReq(workspaceId, 'test-account-id');
      // await GET(req, { params: { id: workspaceId } });
      // expect(globalThis.__AUDIT_EVENTS).toContainEqual(
      //   expect.objectContaining({
      //     event_type: 'workspace.retrieved',
      //     workspace_id: workspaceId,
      //     account_id: 'test-account-id',
      //   })
      // );
    });

    it('should NOT emit audit event on authentication failure (success-only)', async () => {
      const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
      const req = makeReq(workspaceId); // No account_id
      await GET(req, { params: { id: workspaceId } });

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const workspaceEvents = events.filter((e: any) =>
        e.event_type?.startsWith('workspace.')
      );
      expect(workspaceEvents).toHaveLength(0);
    });

    it('should NOT emit audit event on validation failure (success-only)', async () => {
      const req = makeReq('invalid-uuid', 'test-account-id');
      await GET(req, { params: { id: 'invalid-uuid' } });

      const events = globalThis.__AUDIT_EVENTS ?? [];
      const workspaceEvents = events.filter((e: any) =>
        e.event_type?.startsWith('workspace.')
      );
      expect(workspaceEvents).toHaveLength(0);
    });
  });

  describe('Error Shapes (Frozen Contract)', () => {
    it('should return 401 with frozen error shape', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const req = makeReq(validUuid);

      const response = await GET(req, { params: { id: validUuid } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    });

    it('should return 400 with frozen error shape', async () => {
      const req = makeReq('bad-uuid', 'test-account-id');

      const response = await GET(req, { params: { id: 'bad-uuid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'validation_error',
        message: 'Invalid workspace ID format',
      });
    });
  });
});
