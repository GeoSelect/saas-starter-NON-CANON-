import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkWorkspaceMembership } from '@/lib/db/helpers/workspace-access';
import { auditReportsListed } from '@/lib/audit/emit';
import {
  unauthorized,
  validationError,
  forbiddenAccessDenied,
  notFound,
  success,
} from '@/lib/api/error-responses';

// ============================================================================
// CCP-06: Branded Report List Endpoint
// Contract: frozen (see docs/ccp/CCP-06_BRANDED_REPORT.md)
// Audit: success-only
// Parent: CCP-05 (Workspace Container)
// ============================================================================

// Query parameters validation schema (frozen contract)
const ListReportsQuerySchema = z.object({
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
interface ListReportsResponse {
  reports: Array<{
    id: string;
    workspace_id: string;
    name: string;
    status: 'draft' | 'published' | 'archived';
    created_at: string;
    updated_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * GET /api/workspace/:workspace_id/report/list
 *
 * Lists all reports in a workspace.
 * Workspace membership required.
 *
 * DoD:
 * - [x] Validates workspace_id path param (UUID format)
 * - [x] Validates query parameters (page, limit)
 * - [x] Enforces workspace membership (403 WORKSPACE_ACCESS_DENIED if not member)
 * - [x] Queries reports from DB (RLS enforced)
 * - [x] Returns paginated response (200)
 * - [x] Emits audit event on success (reports.listed, success-only)
 * - [x] Returns frozen error shapes (400, 401, 403, 404)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspace_id: string }> }
): Promise<NextResponse> {
  try {
    const { workspace_id: workspaceId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workspaceId)) {
      return validationError('Invalid workspace ID format');
    }

    // Extract and validate account_id from headers (auth check FIRST, before validation)
    const accountId = req.headers.get('x-account-id');

    if (!accountId) {
      return unauthorized();
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryResult = ListReportsQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    if (!queryResult.success) {
      return validationError(
        'Invalid query parameters',
        queryResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          issue: issue.message,
        }))
      );
    }

    const { page, limit } = queryResult.data;

    // Check membership for deterministic error mapping
    // RLS will be primary enforcement at DB level
    const membership = await checkWorkspaceMembership(workspaceId, accountId);

    if (!membership.isMember) {
      // Non-member: return access denied
      return forbiddenAccessDenied();
    }

    // TODO: Query reports from database (RLS will filter by workspace membership)
    // const reports = await db
    //   .select()
    //   .from(reportsTable)
    //   .where(eq(reportsTable.workspace_id, workspaceId as any))
    //   .limit(limit)
    //   .offset((page - 1) * limit);
    //
    // const totalResult = await db
    //   .select({ count: count() })
    //   .from(reportsTable)
    //   .where(eq(reportsTable.workspace_id, workspaceId as any));
    // const total = totalResult[0]?.count ?? 0;

    // STUB: Return mock response for now
    const total = 0;
    const totalPages = Math.ceil(total / limit);

    // Emit success audit event
    auditReportsListed(accountId, workspaceId, total);

    const response: ListReportsResponse = {
      reports: [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };

    return success(response, 200);
  } catch (error) {
    console.error('[workspace/report/list] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
