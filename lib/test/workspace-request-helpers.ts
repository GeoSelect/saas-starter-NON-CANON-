// ============================================================================
// Test Helper: Workspace Request Factory
// ============================================================================
// Simplifies creating requests with different workspace roles/auth states

export type WorkspaceRole = 'admin' | 'member' | 'non-member' | 'unauthenticated';

export interface WorkspaceRequestContext {
  workspaceId: string;
  accountId?: string;
  role?: WorkspaceRole;
}

/**
 * Create a request with workspace context
 * 
 * @param url - Full URL for the request
 * @param options - Request options (method, headers, body)
 * @param context - Workspace context (workspaceId, accountId, role)
 * @returns Request object ready for handler
 * 
 * Examples:
 * ```
 * // Admin user
 * makeWorkspaceRequest(url, { method: 'POST', body }, {
 *   workspaceId: 'ws-123',
 *   accountId: 'acc-admin',
 *   role: 'admin'
 * });
 * 
 * // Member user
 * makeWorkspaceRequest(url, { method: 'GET' }, {
 *   workspaceId: 'ws-123',
 *   accountId: 'acc-member',
 *   role: 'member'
 * });
 * 
 * // Non-member
 * makeWorkspaceRequest(url, { method: 'GET' }, {
 *   workspaceId: 'ws-123',
 *   accountId: 'acc-outsider',
 *   role: 'non-member'
 * });
 * 
 * // Unauthenticated
 * makeWorkspaceRequest(url, { method: 'GET' }, {
 *   workspaceId: 'ws-123',
 *   role: 'unauthenticated'
 * });
 * ```
 */
export function makeWorkspaceRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {},
  context: WorkspaceRequestContext
): Request {
  const headers = new Headers(options.headers ?? {});

  // Set content-type if body provided
  if (options.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  // Set auth context based on role
  if (context.role !== 'unauthenticated' && context.accountId) {
    headers.set('x-account-id', context.accountId);
    
    // Optionally: set role in header (if your middleware supports it)
    if (context.role && context.role !== 'non-member') {
      headers.set('x-workspace-role', context.role);
    }
  }

  return new Request(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  }) as any; // Cast to bypass NextRequest type
}

/**
 * Factory for creating requests with a specific role
 * 
 * Usage:
 * ```
 * const admin = createAdminRequest('ws-123', 'acc-admin');
 * const member = createMemberRequest('ws-123', 'acc-member');
 * const outsider = createNonMemberRequest('ws-123', 'acc-other');
 * const unauth = createUnauthenticatedRequest('ws-123');
 * ```
 */

export function createAdminRequest(
  url: string,
  workspaceId: string,
  accountId: string,
  options: { method?: string; body?: any } = {}
): Request {
  return makeWorkspaceRequest(url, options, {
    workspaceId,
    accountId,
    role: 'admin',
  });
}

export function createMemberRequest(
  url: string,
  workspaceId: string,
  accountId: string,
  options: { method?: string; body?: any } = {}
): Request {
  return makeWorkspaceRequest(url, options, {
    workspaceId,
    accountId,
    role: 'member',
  });
}

export function createNonMemberRequest(
  url: string,
  workspaceId: string,
  accountId: string,
  options: { method?: string; body?: any } = {}
): Request {
  return makeWorkspaceRequest(url, options, {
    workspaceId,
    accountId,
    role: 'non-member',
  });
}

export function createUnauthenticatedRequest(
  url: string,
  options: { method?: string; body?: any } = {}
): Request {
  return makeWorkspaceRequest(url, options, {
    workspaceId: '', // Not used for unauth
    role: 'unauthenticated',
  });
}

/**
 * Helper to test multiple user contexts for the same endpoint
 * 
 * Usage:
 * ```
 * await testWithRoles({
 *   workspaceId: 'ws-123',
 *   url: 'http://localhost:3000/api/workspace/ws-123/report',
 *   handler: GET,
 *   params: { workspace_id: 'ws-123' },
 *   tests: {
 *     admin: { expectedStatus: 200 },
 *     member: { expectedStatus: 200 },
 *     'non-member': { expectedStatus: 403 },
 *     unauthenticated: { expectedStatus: 401 },
 *   }
 * });
 * ```
 */
export interface RoleTestConfig {
  workspaceId: string;
  url: string;
  handler: (req: Request, params: any) => Promise<Response>;
  params: Record<string, string>;
  accountIds?: {
    admin?: string;
    member?: string;
    nonMember?: string;
  };
  tests: {
    admin?: { expectedStatus: number };
    member?: { expectedStatus: number };
    'non-member'?: { expectedStatus: number };
    unauthenticated?: { expectedStatus: number };
  };
}

export async function testWithRoles(config: RoleTestConfig) {
  const {
    workspaceId,
    url,
    handler,
    params,
    accountIds = {
      admin: 'admin-account-id',
      member: 'member-account-id',
      nonMember: 'non-member-account-id',
    },
    tests,
  } = config;

  const results: Record<string, { status: number; error?: string }> = {};

  // Test admin
  if (tests.admin) {
    const req = createAdminRequest(url, workspaceId, accountIds.admin!);
    const res = await handler(req, params);
    results.admin = { status: res.status };
  }

  // Test member
  if (tests.member) {
    const req = createMemberRequest(url, workspaceId, accountIds.member!);
    const res = await handler(req, params);
    results.member = { status: res.status };
  }

  // Test non-member
  if (tests['non-member']) {
    const req = createNonMemberRequest(
      url,
      workspaceId,
      accountIds.nonMember!
    );
    const res = await handler(req, params);
    results['non-member'] = { status: res.status };
  }

  // Test unauthenticated
  if (tests.unauthenticated) {
    const req = createUnauthenticatedRequest(url);
    const res = await handler(req, params);
    results.unauthenticated = { status: res.status };
  }

  return results;
}
