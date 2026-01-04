import { NextRequest, NextResponse } from "next/server";
import { supabaseRSC } from "@/lib/supabase/server";
import { headers } from "next/headers";

interface CreateSnapshotRequest {
  parcel_id: string;
  parcel_address: string;
  parcel_jurisdiction?: string;
  parcel_zoning?: string;
  parcel_apn?: string;
  parcel_geometry?: GeoJSON.Geometry | null;
  parcel_sources?: string[];
  summary_text?: string;
  constraints?: Record<string, unknown>;
  sources?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

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

    const body: CreateSnapshotRequest = await req.json();

    // Validate required fields
    if (!body.parcel_id || !body.parcel_address) {
      return NextResponse.json(
        { error: "parcel_id and parcel_address are required" },
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

    // Create snapshot
    const { data: snapshot, error: createError } = await supabase
      .from("parcel_snapshots")
      .insert({
        workspace_id,
        user_id: user.id,
        parcel_id: body.parcel_id,
        parcel_address: body.parcel_address,
        parcel_jurisdiction: body.parcel_jurisdiction || null,
        parcel_zoning: body.parcel_zoning || null,
        parcel_apn: body.parcel_apn || null,
        parcel_geometry: body.parcel_geometry || null,
        parcel_sources: body.parcel_sources || [],
        summary_text: body.summary_text || null,
        constraints: body.constraints || {},
        sources: body.sources || {},
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (createError) {
      console.error("Snapshot creation error:", createError);
      return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, snapshot }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET snapshots for workspace
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

    // Fetch snapshots (RLS will filter to user's own)
    const { data: snapshots, error: listError } = await supabase
      .from("parcel_snapshots")
      .select()
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (listError) {
      console.error("Snapshot list error:", listError);
      return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, snapshots }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
