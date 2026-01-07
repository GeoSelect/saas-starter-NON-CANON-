import { NextRequest, NextResponse } from "next/server";
import { supabaseRSC } from "@/lib/supabase/server";

interface ActivityListQuery {
  activityType?: string;
  limit?: number;
  offset?: number;
}

export async function GET(
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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const activityType = searchParams.get("activityType") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query
    let query = supabase
      .from("activities")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspace_id)
      .order("created_at", { ascending: false });

    // Filter by activity type if provided
    if (activityType) {
      query = query.eq("activity_type", activityType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: activities, error: queryError, count } = await query;

    if (queryError) {
      console.error("Activity query error:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        activities: activities || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
