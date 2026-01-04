import { NextRequest, NextResponse } from "next/server";
import { supabaseRSC } from "@/lib/supabase/server";
import { logParcelSelected } from "@/lib/helpers/activity-logger";

interface ParcelSelectionRequest {
  parcel_id: string;
  apn?: string;
  source?: "parcel_resolve" | "map_click" | "search_result";
  confidence?: number;
  request_id?: string;
}

/**
 * POST /api/workspaces/[workspace_id]/parcels/selected
 * Log a deliberate parcel selection (non-search boundary)
 * This endpoint should be called only when user commits to a parcel selection
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

    const body: ParcelSelectionRequest = await req.json();

    // Validate required fields
    if (!body.parcel_id) {
      return NextResponse.json(
        { error: "parcel_id is required" },
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

    // Log parcel selection activity asynchronously (non-blocking)
    logParcelSelected(
      user.id,
      workspace_id,
      body.parcel_id,
      body.apn,
      body.source || "search_result",
      body.confidence,
      body.request_id
    ).catch((err) => console.error("Activity logging failed:", err));

    return NextResponse.json(
      {
        ok: true,
        message: "Parcel selection recorded",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
