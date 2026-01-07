import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  createBrandedReport,
  listBrandedReports,
} from "@/lib/db/helpers/branded-reports";
import { checkWorkspaceMembership } from "@/lib/db/helpers/workspace-access";
import {
  CREATE_REPORT_RESPONSE,
  LIST_REPORTS_RESPONSE,
  HTTP_STATUS,
} from "@/lib/contracts/ccp06/error-codes";

// ============================================================================
// POST /api/workspaces/[workspace_id]/branded-reports
// GET /api/workspaces/[workspace_id]/branded-reports
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspace_id: string }> }
) {
  try {
    const { workspace_id } = await params;

    // Get authenticated user
    const cookieStore = await cookies();
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await client.auth.getUser();

    // Check authentication
    if (!user) {
      return NextResponse.json(
        {
          error: CREATE_REPORT_RESPONSE.ERROR_UNAUTHORIZED_401.error,
          message: CREATE_REPORT_RESPONSE.ERROR_UNAUTHORIZED_401.message,
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Check workspace membership and admin role
    const membership = await checkWorkspaceMembership(workspace_id, user.id);

    if (!membership.isMember) {
      return NextResponse.json(
        {
          error: CREATE_REPORT_RESPONSE.ERROR_ACCESS_DENIED_403.error,
          message: CREATE_REPORT_RESPONSE.ERROR_ACCESS_DENIED_403.message,
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Admin-only for report creation
    if (!membership.isAdmin) {
      return NextResponse.json(
        {
          error: CREATE_REPORT_RESPONSE.ERROR_ADMIN_REQUIRED_403.error,
          message: CREATE_REPORT_RESPONSE.ERROR_ADMIN_REQUIRED_403.message,
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, projection, branding, status } = body;

    if (!projection) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Invalid parcel_context: missing required fields",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Create report
    const report = await createBrandedReport({
      workspace_id,
      name: name || `Report ${new Date().toISOString()}`,
      status,
      projection,
      branding,
    });

    return NextResponse.json(report, { status: HTTP_STATUS.OK });
  } catch (error: any) {
    console.error("POST /api/workspaces/[id]/branded-reports:", error);

    if (error.message?.includes("WORKSPACE_ACCESS_DENIED")) {
      return NextResponse.json(
        {
          error: "WORKSPACE_ACCESS_DENIED",
          message: "Access denied to this workspace",
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    if (error.message?.includes("VALIDATION_ERROR")) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: error.message.replace("VALIDATION_ERROR: ", ""),
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspace_id: string }> }
) {
  try {
    const { workspace_id } = await params;

    // Get authenticated user
    const cookieStore = await cookies();
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await client.auth.getUser();

    // Check authentication
    if (!user) {
      return NextResponse.json(
        {
          error: LIST_REPORTS_RESPONSE.ERROR_UNAUTHORIZED_401.error,
          message: LIST_REPORTS_RESPONSE.ERROR_UNAUTHORIZED_401.message,
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Check workspace membership (members can read)
    const membership = await checkWorkspaceMembership(workspace_id, user.id);

    if (!membership.isMember) {
      return NextResponse.json(
        {
          error: LIST_REPORTS_RESPONSE.ERROR_ACCESS_DENIED_403.error,
          message: LIST_REPORTS_RESPONSE.ERROR_ACCESS_DENIED_403.message,
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Parse pagination parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      parseInt(url.searchParams.get("limit") || "50")
    );
    const offset = (page - 1) * limit;
    const status = url.searchParams.get("status") as
      | "draft"
      | "published"
      | "archived"
      | null;

    // List reports
    const { reports, total } = await listBrandedReports({
      workspace_id,
      status: status || undefined,
      limit,
      offset,
    });

    return NextResponse.json(
      {
        reports: reports.map((r) => ({
          id: r.id,
          workspace_id: r.workspace_id,
          name: r.name,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    console.error("GET /api/workspaces/[id]/branded-reports:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
