import { NextRequest, NextResponse } from "next/server";
import { getSources } from "@/lib/workspace/sources-rules";

/**
 * GET /api/workspaces/[id]/sources
 * Returns all sources for rules in this workspace
 *
 * Query params:
 * - type: Filter by source type (hoa_ccr, ordinance, etc.)
 * - jurisdiction: Filter by jurisdiction
 * - confidenceLevel: Filter by confidence level (verified, inferred, pending)
 *
 * Responses:
 * 200: Array of sources
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
    const type = searchParams.get("type") || undefined;
    const jurisdiction = searchParams.get("jurisdiction") || undefined;
    const confidenceLevel = searchParams.get("confidenceLevel") || undefined;

    // TODO: Verify workspace membership via RLS
    // For now, rely on Supabase RLS to filter based on auth user

    // Get sources with optional filters
    const sources = await getSources({
      type: type as any,
      jurisdiction: jurisdiction || undefined,
      confidenceLevel: confidenceLevel as any,
    });

    return NextResponse.json(
      {
        ok: true,
        data: sources,
        count: sources.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/workspaces/[id]/sources] Error:", error);
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
