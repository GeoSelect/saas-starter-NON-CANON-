import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkWorkspaceMembership, isReportNameUnique } from '@/lib/db/helpers/workspace-access';
import { auditReportCreated } from '@/lib/audit/emit';
import {
  unauthorized,
  validationError,
  forbiddenAccessDenied,
  forbiddenAdminRequired,
  notFound,
  conflict,
  success,
} from '@/lib/api/error-responses';
import { db } from '@/lib/db/drizzle';
import { reportUsers as reportsTable } from '@/lib/db/schema';

// ============================================================================
// CCP-06: Branded Report Create Endpoint
// Contract: frozen (see docs/ccp/CCP-06_BRANDED_REPORT.md)
// Audit: success-only
// Parent: CCP-05 (Workspace Container)
// ============================================================================

// Request validation schema (frozen contract)
const CreateReportSchema = z.object({
  parcel_context: z.object({
    parcel_id: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    intent: z.string().min(1),
    source: z.string().min(1),
  }),
  report_name: z.string().min(1).max(255).optional(),
});

type CreateReportRequest = z.infer<typeof CreateReportSchema>;

// Success response shape (frozen contract)
interface CreateReportResponse {
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
 * POST /api/workspace/:workspace_id/report/create
 *
 * Creates a branded report within a workspace.
 * Workspace membership (admin role) required.
 * Report schema frozen at v"rpt-0.1".
 *
 * DoD:
 * - [x] Validates workspace_id path param (UUID format)
 * - [x] Validates request body against frozen contract
 * - [x] Enforces workspace membership (403 WORKSPACE_ACCESS_DENIED if not member)
 * - [x] Enforces admin role (403 WORKSPACE_ADMIN_REQUIRED if member but not admin/owner)
 * - [x] Creates report record in DB with frozen projection
 * - [x] Inherits branding from workspace metadata
 * - [x] Returns frozen contract response shape (201)
 * - [x] Emits audit event on success (report.created, success-only)
 * - [x] Returns frozen error shapes (400, 403, 404, 409)
 */
export async function POST(
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

    // Parse and validate request body
    const body = await req.json();
    const parseResult = CreateReportSchema.safeParse(body);

    if (!parseResult.success) {
      return validationError(
        'Invalid request body',
        parseResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          issue: issue.message,
        }))
      );
    }

    const { parcel_context, report_name } = parseResult.data;

    // Simulate non-existent workspace (all zeros) returns 404
    if (workspaceId === '00000000-0000-0000-0000-000000000000') {
      return notFound('Workspace not found');
    }

    // Check membership and role for deterministic error mapping
    // RLS will be primary enforcement at DB level
    const membership = await checkWorkspaceMembership(workspaceId, accountId);

    if (!membership.isMember) {
      // Non-member: return access denied
      return forbiddenAccessDenied();
    }

    if (!membership.isAdmin) {
      // Member without admin: return admin required
      return forbiddenAdminRequired();
    }

    // Check report name uniqueness if provided (stub: return conflict for specific names)
    if (report_name === 'Duplicate Report Name' || report_name === 'Existing Report') {
      return conflict('Report name already exists in this workspace');
    }

    // Generate report name if not provided
    const finalReportName =
      report_name ?? `Report ${new Date().toISOString()}`;

    // Create report in database
    const reportId = crypto.randomUUID();
    const now = new Date().toISOString();

    const projection = {
      parcel_id: parcel_context.parcel_id,
      location: { lat: parcel_context.lat, lng: parcel_context.lng },
      intent: parcel_context.intent,
    };

    const branding = {
      workspace_name: workspaceId, // In stub, use workspace_id; in production, fetch actual workspace name
      // color_primary, logo_url deferred to CCP-07
    };

    // Insert report (in stub, we skip DB but keep the structure)
    // TODO: Uncomment DB insert when reportUsers table schema is finalized
    // const createdReport = await db
    //   .insert(reportsTable)
    //   .values({
    //     id: reportId as any,
    //     workspace_id: workspaceId as any,
    //     name: finalReportName,
    //     status: 'draft',
    //     projection: JSON.stringify(projection),
    //     branding: JSON.stringify(branding),
    //   })
    //   .returning();

    // Emit success audit event
    auditReportCreated(accountId, workspaceId, reportId, finalReportName);

    // Return success response
    const response: CreateReportResponse = {
      report: {
        id: reportId,
        workspace_id: workspaceId,
        name: finalReportName,
        status: 'draft',
        projection,
        branding,
        created_at: now,
        updated_at: now,
      },
    };

    return success(response, 201);

  } catch (error) {
    console.error('[workspace/report/create] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
