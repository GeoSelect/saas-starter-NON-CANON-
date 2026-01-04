import { NextRequest, NextResponse } from "next/server";
import { getDataGaps } from "@/lib/workspace/sources-rules";

/**
 * GET /api/workspaces/[id]/gaps
 * Returns data gaps/conflicts for this workspace
 *
 * Query params:
 * - parcelId: Filter by parcel ID
 * - gapType: Filter by gap type (missing, conflict, outdated, unverified)
 * - severity: Filter by severity (critical, warning, info)
 * - resolutionStatus: Filter by status (open, investigating, resolved)
 *
 * Responses:
 * 200: Array of data gaps
 * 401: Unauthenticated
 * 403: Not a workspace member
 * 404: Workspace not found
 * 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const workspaceId = params.id;

    if (!workspaceId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Workspace ID required",
          code: "missing_workspace_id",
        },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const parcelId = searchParams.get("parcelId") || undefined;
    const gapType = searchParams.get("gapType") || undefined;
    const severity = searchParams.get("severity") || undefined;
    const resolutionStatus = searchParams.get("resolutionStatus") || undefined;

    // TODO: Verify workspace membership via RLS
    // For now, rely on Supabase RLS to filter based on auth user

    // Get gaps with optional filters
    const gaps = await getDataGaps(workspaceId, {
      parcel_id: parcelId,
      gap_type: gapType,
      severity: severity,
      resolution_status: resolutionStatus,
    });

    // Calculate summary
    const summary = {
      total: gaps.length,
      by_type: gaps.reduce(
        (acc, gap) => {
          acc[gap.gap_type] = (acc[gap.gap_type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      by_severity: gaps.reduce(
        (acc, gap) => {
          acc[gap.severity] = (acc[gap.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      by_status: gaps.reduce(
        (acc, gap) => {
          acc[gap.resolution_status] = (acc[gap.resolution_status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return NextResponse.json(
      {
        ok: true,
        data: gaps,
        summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/workspaces/[id]/gaps] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
        code: "internal_server_error",
      },
      { status: 500 }
    );
  }
}
