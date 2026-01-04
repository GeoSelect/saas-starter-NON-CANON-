/**
 * Example: Using Workspace Request Helpers in Tests
 * 
 * This demonstrates how to use the workspace request factory to test
 * different user roles and auth states efficiently.
 */

import { describe, it, expect } from 'vitest';
import {
  createAdminRequest,
  createMemberRequest,
  createNonMemberRequest,
  createUnauthenticatedRequest,
  testWithRoles,
} from '../workspace-request-helpers';

// ============================================================================
// Example 1: Individual role requests
// ============================================================================

describe('Example: Individual Role Requests', () => {
  const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
  const baseUrl = `http://localhost:3000/api/workspace/${workspaceId}/reports`;

  it('admin request includes x-account-id header', () => {
    const req = createAdminRequest(baseUrl, workspaceId, 'admin-account-id', {
      method: 'GET',
    });

    expect(req.method).toBe('GET');
    expect(req.headers.get('x-account-id')).toBe('admin-account-id');
    expect(req.headers.get('x-workspace-role')).toBe('admin');
  });

  it('member request includes x-account-id header', () => {
    const req = createMemberRequest(
      baseUrl,
      workspaceId,
      'member-account-id',
      { method: 'GET' }
    );

    expect(req.method).toBe('GET');
    expect(req.headers.get('x-account-id')).toBe('member-account-id');
    expect(req.headers.get('x-workspace-role')).toBe('member');
  });

  it('non-member request includes x-account-id but not x-workspace-role', () => {
    const req = createNonMemberRequest(
      baseUrl,
      workspaceId,
      'other-account-id',
      { method: 'GET' }
    );

    expect(req.method).toBe('GET');
    expect(req.headers.get('x-account-id')).toBe('other-account-id');
    expect(req.headers.get('x-workspace-role')).toBeNull();
  });

  it('unauthenticated request has no x-account-id header', () => {
    const req = createUnauthenticatedRequest(baseUrl, { method: 'GET' });

    expect(req.method).toBe('GET');
    expect(req.headers.get('x-account-id')).toBeNull();
    expect(req.headers.get('x-workspace-role')).toBeNull();
  });
});

// ============================================================================
// Example 2: POST request with body
// ============================================================================

describe('Example: POST Request with Body', () => {
  const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
  const baseUrl = `http://localhost:3000/api/workspace/${workspaceId}/report/create`;
  const reportBody = {
    parcel_context: {
      parcel_id: 'p-123',
      lat: 39.7392,
      lng: -105.0844,
      intent: 'assessment',
      source: 'manual',
    },
    report_name: 'Test Report',
  };

  it('admin can create report request', async () => {
    const req = createAdminRequest(
      baseUrl,
      workspaceId,
      'admin-account-id',
      {
        method: 'POST',
        body: reportBody,
      }
    );

    expect(req.method).toBe('POST');
    expect(req.headers.get('content-type')).toBe('application/json');
    expect(req.headers.get('x-account-id')).toBe('admin-account-id');

    // Body is properly stringified
    const body = await req.json();
    expect(body.parcel_context.parcel_id).toBe('p-123');
  });

  it('member can create report request', async () => {
    const req = createMemberRequest(
      baseUrl,
      workspaceId,
      'member-account-id',
      {
        method: 'POST',
        body: reportBody,
      }
    );

    expect(req.method).toBe('POST');
    expect(req.headers.get('x-account-id')).toBe('member-account-id');

    const body = await req.json();
    expect(body.parcel_context.intent).toBe('assessment');
  });
});

// ============================================================================
// Example 3: Batch testing multiple roles
// ============================================================================

describe('Example: Batch Role Testing', () => {
  const workspaceId = '550e8400-e29b-41d4-a716-446655440000';

  it('demonstrates testWithRoles structure', async () => {
    // This is a mock handler for demo purposes
    const mockHandler = async (req: Request, params: any) => {
      const accountId = req.headers.get('x-account-id');
      const role = req.headers.get('x-workspace-role');

      // Simulate authorization logic
      if (!accountId) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
        });
      }

      if (role !== 'admin' && role !== 'member') {
        return new Response(JSON.stringify({ error: 'forbidden' }), {
          status: 403,
        });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };

    const results = await testWithRoles({
      workspaceId,
      url: `http://localhost:3000/api/workspace/${workspaceId}/reports`,
      handler: mockHandler,
      params: { workspace_id: workspaceId },
      tests: {
        admin: { expectedStatus: 200 },
        member: { expectedStatus: 200 },
        'non-member': { expectedStatus: 403 },
        unauthenticated: { expectedStatus: 401 },
      },
    });

    expect(results.admin.status).toBe(200);
    expect(results.member.status).toBe(200);
    expect(results['non-member'].status).toBe(403);
    expect(results.unauthenticated.status).toBe(401);
  });
});
