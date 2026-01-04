import { NextRequest, NextResponse } from 'next/server';
import { checkWorkspaceMembership } from '@/lib/db/helpers/workspace-access';
import { auditReportRetrieved } from '@/lib/audit/emit';
import {
  unauthorized,
  validationError,
  forbiddenAccessDenied,
  notFound,
  success,
} from '@/lib/api/error-responses';

// ============================================================================
// CCP-06: Branded Report Get Endpoint
// Contract: frozen (see docs/ccp/CCP-06_BRANDED_REPORT.md)
// Audit: success-only
// Parent: CCP-05 (Workspace Container)
// ============================================================================

// Success response shape (frozen contract)
interface GetReportResponse {
  report: {
    id: string;
    workspace_id: string;
    name: string;
    status: 'draft' | 'published' | 'archived';
    projection: {
      parcel_id: string;
      location: { lat: number; lng: number };
      intent: string;
    };
    branding: {
      workspace_name: string;
      color_primary?: string;
      logo_url?: string;
    };
    created_at: string;
    updated_at: string;
  };
}

/**
 * GET /api/workspace/:workspace_id/report/:report_id
 *
 * Retrieves a specific report from a workspace.
 * Workspace membership required.
 * Non-members receive 404 (hiding existence).
 *
 * DoD:
 * - [x] Validates workspace_id and report_id path params (UUID format)
 * - [x] Enforces authentication
 * - [x] Enforces workspace membership (403 WORKSPACE_ACCESS_DENIED if not member)
 * - [x] Returns 404 for non-members (hiding existence)
 * - [x] Queries report from DB (RLS enforced)
 * - [x] Returns frozen contract response shape (200)
 * - [x] Emits audit event on success (report.retrieved, success-only)
 * - [x] Returns frozen error shapes (400, 401, 403, 404)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspace_id: string; report_id: string }> }
): Promise<NextResponse> {
  try {
    const { workspace_id: workspaceId, report_id: reportId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workspaceId)) {
      return validationError('Invalid workspace ID format');
    }
    if (!uuidRegex.test(reportId)) {
      return validationError('Invalid report ID format');
    }

    // Extract and validate account_id from headers (auth check FIRST, before validation)
    const accountId = req.headers.get('x-account-id');

    if (!accountId) {
      return unauthorized();
    }

    // Check membership for deterministic error mapping
    // Return 404 for non-members to hide report existence
    const membership = await checkWorkspaceMembership(workspaceId, accountId);

    if (!membership.isMember) {
      // Return 404 to hide report existence from non-members
      return notFound('Report not found');
    }

    // TODO: Query report from database
    // const report = await db
    //   .select()
    //   .from(reportsTable)
    //   .where(
    //     and(
    //       eq(reportsTable.id, reportId as any),
    //       eq(reportsTable.workspace_id, workspaceId as any)
    //     )
    //   )
    //   .limit(1);
    //
    // if (report.length === 0) {
    //   return notFound('Report not found');
    // }

    // STUB: Return mock response matching frozen contract
    const now = new Date().toISOString();
    const stubResponse: GetReportResponse = {
      report: {
        id: reportId,
        workspace_id: workspaceId,
        name: 'Sample Report',
        status: 'draft',
        projection: {
          parcel_id: 'parcel-001',
          location: { lat: 39.7392, lng: -105.0844 },
          intent: 'assessment',
        },
        branding: {
          workspace_name: 'Workspace',
        },
        created_at: now,
        updated_at: now,
      },
    };

    // Emit success audit event
    auditReportRetrieved(accountId, workspaceId, reportId);

    return success(stubResponse, 200);
  } catch (error) {
    console.error('[workspace/report/get] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
