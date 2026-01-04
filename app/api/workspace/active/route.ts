import { NextRequest, NextResponse } from "next/server";
import {
  getActiveWorkspace,
  setActiveWorkspace,
  ActiveWorkspaceResponse,
} from "@/lib/workspace/active-workspace";

/**
 * GET /api/workspace/active
 * Returns the authenticated user's current active workspace
 *
 * Responses:
 * 200: OK with active workspace data
 * 401: Unauthenticated
 * 403: No active workspace set
 * 500: Server error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const result = await getActiveWorkspace();

    if (!result.ok) {
      const statusCode =
        result.code === "workspace_active_unauthenticated" ? 401 : 403;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[GET /api/workspace/active] Error:", error);
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

/**
 * POST /api/workspace/active
 * Sets the authenticated user's active workspace
 *
 * Request body:
 * {
 *   "workspace_id": "uuid"
 * }
 *
 * Responses:
 * 200: OK with updated active workspace
 * 400: Invalid request (contract violation)
 * 401: Unauthenticated
 * 403: User not a member of the workspace
 * 500: Server error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON",
          code: "workspace_active_contract",
        },
        { status: 400 }
      );
    }

    // Validate request contract
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request body",
          code: "workspace_active_contract",
        },
        { status: 400 }
      );
    }

    const { workspace_id } = body;

    if (!workspace_id || typeof workspace_id !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing or invalid workspace_id",
          code: "workspace_active_contract",
        },
        { status: 400 }
      );
    }

    // Set active workspace
    const result = await setActiveWorkspace(workspace_id);

    if (!result.ok) {
      const statusCode = (() => {
        if (result.code === "workspace_active_unauthenticated") return 401;
        if (result.code === "workspace_active_contract") return 400;
        if (result.code === "workspace_active_forbidden") return 403;
        return 500;
      })();
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[POST /api/workspace/active] Error:", error);
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
