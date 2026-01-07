import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getBrandedReport,
  updateBrandedReport,
  deleteBrandedReport,
} from "@/lib/db/helpers/branded-reports";
import { checkWorkspaceMembership } from "@/lib/db/helpers/workspace-access";
import {
  GET_REPORT_RESPONSE,
  HTTP_STATUS,
} from "@/lib/contracts/ccp06/error-codes";

// ============================================================================
// GET /api/workspaces/[workspace_id]/branded-reports/[report_id]
// PUT /api/workspaces/[workspace_id]/branded-reports/[report_id]
// DELETE /api/workspaces/[workspace_id]/branded-reports/[report_id]
// ============================================================================

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ workspace_id: string; report_id: string }> }
) {
  try {
    const { workspace_id, report_id } = await params;

    // Validate ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(report_id)) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Invalid report ID format",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

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
          error: GET_REPORT_RESPONSE.ERROR_UNAUTHORIZED_401.error,
          message: GET_REPORT_RESPONSE.ERROR_UNAUTHORIZED_401.message,
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Check workspace membership (members can read)
    const membership = await checkWorkspaceMembership(workspace_id, user.id);

    if (!membership.isMember) {
      // Return 404 to hide existence from non-members
      return NextResponse.json(
        {
          error: GET_REPORT_RESPONSE.ERROR_NOT_FOUND_404.error,
          message: GET_REPORT_RESPONSE.ERROR_NOT_FOUND_404.message,
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Get report
    const report = await getBrandedReport(report_id, workspace_id);

    if (!report) {
      return NextResponse.json(
        {
          error: GET_REPORT_RESPONSE.ERROR_NOT_FOUND_404.error,
          message: GET_REPORT_RESPONSE.ERROR_NOT_FOUND_404.message,
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    return NextResponse.json(report, { status: HTTP_STATUS.OK });
  } catch (error: any) {
    console.error(
      "GET /api/workspaces/[id]/branded-reports/[report_id]:",
      error
    );
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ workspace_id: string; report_id: string }> }
) {
  try {
    const { workspace_id, report_id } = await params;

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
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Check workspace membership and admin role
    const membership = await checkWorkspaceMembership(workspace_id, user.id);

    if (!membership.isMember) {
      return NextResponse.json(
        {
          error: "WORKSPACE_ACCESS_DENIED",
          message: "Access denied to this workspace",
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Admin-only for updates
    if (!membership.isAdmin) {
      return NextResponse.json(
        {
          error: "WORKSPACE_ADMIN_REQUIRED",
          message: "Admin or owner role required to update reports",
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, status, branding } = body;

    // Update report
    const updatedReport = await updateBrandedReport({
      id: report_id,
      workspace_id,
      name,
      status,
      branding,
    });

    return NextResponse.json(updatedReport, { status: HTTP_STATUS.OK });
  } catch (error: any) {
    console.error(
      "PUT /api/workspaces/[id]/branded-reports/[report_id]:",
      error
    );

    if (error.message?.includes("NOT_FOUND")) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Report does not exist" },
        { status: HTTP_STATUS.NOT_FOUND }
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

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ workspace_id: string; report_id: string }> }
) {
  try {
    const { workspace_id, report_id } = await params;

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
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Check workspace membership and admin role
    const membership = await checkWorkspaceMembership(workspace_id, user.id);

    if (!membership.isMember) {
      return NextResponse.json(
        {
          error: "WORKSPACE_ACCESS_DENIED",
          message: "Access denied to this workspace",
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Admin-only for deletion
    if (!membership.isAdmin) {
      return NextResponse.json(
        {
          error: "WORKSPACE_ADMIN_REQUIRED",
          message: "Admin or owner role required to delete reports",
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Delete report
    await deleteBrandedReport(report_id, workspace_id);

    return NextResponse.json({}, { status: 204 });
  } catch (error: any) {
    console.error(
      "DELETE /api/workspaces/[id]/branded-reports/[report_id]:",
      error
    );

    if (error.message?.includes("WORKSPACE_ACCESS_DENIED")) {
      return NextResponse.json(
        {
          error: "WORKSPACE_ACCESS_DENIED",
          message: "Access denied to this workspace",
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
