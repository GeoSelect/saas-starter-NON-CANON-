import { NextRequest, NextResponse } from "next/server";
import { supabaseRSC } from "@/lib/supabase/server";
import { logReportShared } from "@/lib/helpers/activity-logger";

interface ReportShareRequest {
  report_id: string;
  shared_with: {
    contact_id?: string;
    user_id?: string;
    email?: string;
  };
  role_granted?: "viewer" | "commenter" | "editor";
  channel?: "email" | "workspace" | "sms" | "link_only";
  message_id?: string;
}

/**
 * POST /api/workspaces/[workspace_id]/reports/share
 * Log a report share action to a known principal (contact/user/email)
 * This endpoint logs the share action and can optionally trigger notifications
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspace_id: string }> }
) {
  try {
    const { workspace_id } = await params;
    const supabase = await supabaseRSC();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ReportShareRequest = await req.json();

    // Validate required fields
    if (!body.report_id) {
      return NextResponse.json(
        { error: "report_id is required" },
        { status: 400 }
      );
    }

    if (!body.shared_with || (!body.shared_with.contact_id && !body.shared_with.user_id && !body.shared_with.email)) {
      return NextResponse.json(
        { error: "shared_with must include contact_id, user_id, or email" },
        { status: 400 }
      );
    }

    // Check user has access to workspace
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "You don't have access to this workspace" },
        { status: 403 }
      );
    }

    // TODO: If integrating with actual share functionality:
    // 1. Create share record in database (contact_access, user_access, email_invite tables)
    // 2. Generate share token if needed
    // 3. Send notification (email/SMS)
    // 4. Return share result

    // Log report share activity asynchronously (non-blocking)
    logReportShared(
      user.id,
      workspace_id,
      body.report_id,
      body.shared_with,
      body.role_granted || "viewer",
      body.channel || "email",
      body.message_id
    ).catch((err) => console.error("Activity logging failed:", err));

    return NextResponse.json(
      {
        ok: true,
        message: "Report share recorded",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
