import { NextRequest, NextResponse } from "next/server";
import { supabaseRSC } from "@/lib/supabase/server";
import { logRulesEvaluated } from "@/lib/helpers/activity-logger";
import crypto from "crypto";

interface EvaluateRulesRequest {
  parcel_id: string;
  ruleset_version?: string;
  evaluated: number;
  passed: number;
  failed: number;
  duration_ms?: number;
  inputs_hash?: string;
}

/**
 * POST /api/workspaces/[workspace_id]/rules/evaluate
 * Log rule evaluation activity for a parcel
 * This endpoint captures the results of running the deterministic rule evaluation
 * Used for CTRL-E01 (rule evaluation) and audit trail (CTRL-F06)
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

    const body: EvaluateRulesRequest = await req.json();

    // Validate required fields
    if (!body.parcel_id) {
      return NextResponse.json(
        { error: "parcel_id is required" },
        { status: 400 }
      );
    }

    if (typeof body.evaluated !== "number" || typeof body.passed !== "number" || typeof body.failed !== "number") {
      return NextResponse.json(
        { error: "evaluated, passed, and failed counts are required" },
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

    // TODO: Optionally store rule evaluation result in a rules_evaluations table for reproducibility
    // This would enable:
    // - Audit trail of what rules were evaluated and when
    // - Reproducibility: re-run same rules with same inputs_hash
    // - Performance metrics: track duration_ms over time
    // - Debugging: compare results across different versions

    // Log rule evaluation activity asynchronously (non-blocking)
    logRulesEvaluated(
      user.id,
      workspace_id,
      body.parcel_id,
      body.ruleset_version || "0.1",
      {
        evaluated: body.evaluated,
        passed: body.passed,
        failed: body.failed,
      },
      body.duration_ms,
      body.inputs_hash
    ).catch((err) => console.error("Activity logging failed:", err));

    return NextResponse.json(
      {
        ok: true,
        message: "Rule evaluation recorded",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Helper function to compute inputs hash for reproducibility
 * Can be used by callers to hash rule inputs for consistent tracking
 */
export function computeInputsHash(inputs: Record<string, unknown>): string {
  const inputString = JSON.stringify(inputs, Object.keys(inputs).sort());
  return crypto.createHash("sha256").update(inputString).digest("hex");
}
