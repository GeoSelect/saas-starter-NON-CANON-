import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// CCP-05: Workspaces List Endpoint
// Contract: frozen (see docs/api/workspace_contracts.md)
// Audit: success-only
// ============================================================================

// Query parameters validation schema (frozen contract)
const ListWorkspacesQuerySchema = z.object({
  page: z
    .string()
    .nullish()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .nullish()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

// Success response shape (frozen contract)
interface ListWorkspacesResponse {
  workspaces: Array<{
    id: string;
    name: string;
    owner_account_id: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    my_role: 'owner' | 'admin' | 'member';
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * GET /api/workspaces
 * 
 * Lists all workspaces the authenticated account is a member of.
 * Supports pagination via query parameters.
 * 
 * DoD:
 * - [x] Validates query parameters (page, limit)
 * - [x] Enforces authentication (account_id from session)
 * - [ ] Queries workspaces where user is a member (via RLS)
 * - [ ] Includes user's role in each workspace (my_role field)
 * - [ ] Returns paginated response (200)
 * - [ ] Emits audit event on success (workspaces.listed)
 * - [x] Returns frozen error shapes (400, 401)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // TODO: Extract account_id from session/auth middleware (check FIRST, before validation)
    const accountId = req.headers.get('x-account-id'); // Temporary stub

    if (!accountId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryResult = ListWorkspacesQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Invalid query parameters',
          details: queryResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            issue: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { page, limit } = queryResult.data;

    // TODO: Query workspaces with RLS enforcement + pagination
    // const offset = (page - 1) * limit;
    // const workspacesQuery = await db
    //   .select({
    //     workspace: workspaces,
    //     my_role: workspace_members.role,
    //   })
    //   .from(workspaces)
    //   .innerJoin(
    //     workspace_members,
    //     eq(workspace_members.workspace_id, workspaces.id)
    //   )
    //   .where(eq(workspace_members.account_id, accountId))
    //   .limit(limit)
    //   .offset(offset);

    // TODO: Get total count for pagination
    // const totalCount = await db
    //   .select({ count: sql<number>`count(*)` })
    //   .from(workspace_members)
    //   .where(eq(workspace_members.account_id, accountId))
    //   .then((result) => result[0]?.count ?? 0);

    // const totalPages = Math.ceil(totalCount / limit);

    // TODO: Emit audit event (workspaces.listed)
    // emitAuditEvent({
    //   event_type: 'workspaces.listed',
    //   account_id: accountId,
    //   request_id: req.headers.get('x-request-id') ?? crypto.randomUUID(),
    //   metadata: {
    //     count: workspacesQuery.length,
    //     page,
    //   },
    //   timestamp: new Date().toISOString(),
    // });

    // STUB: Return mock response matching frozen contract
    const stubResponse: ListWorkspacesResponse = {
      workspaces: [
        {
          id: crypto.randomUUID(),
          name: 'My First Workspace',
          owner_account_id: accountId,
          metadata: { description: 'Default workspace' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          my_role: 'owner',
        },
      ],
      pagination: {
        page,
        limit,
        total: 1,
        total_pages: 1,
      },
    };

    return NextResponse.json(stubResponse, { status: 200 });
  } catch (error) {
    console.error('[workspaces/list] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
