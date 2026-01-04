import { NextRequest, NextResponse } from "next/server";
import { getRuleProvenance } from "@/lib/db/helpers/provenance";

/**
 * GET /api/rules/[id]/sources
 * Returns sources and citations for a specific rule
 *
 * Responses:
 * 200: Rule with sources and citations
 * 401: Unauthenticated
 * 403: Not a workspace member for this rule's workspace
 * 404: Rule not found
 * 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const ruleId = params.id;

    if (!ruleId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Rule ID required",
          code: "missing_rule_id",
        },
        { status: 400 }
      );
    }

    // TODO: Verify workspace membership via RLS
    // For now, rely on Supabase RLS to filter based on auth user

    // Get complete rule provenance
    const provenance = await getRuleProvenance(ruleId);

    if (!provenance.rule) {
      return NextResponse.json(
        {
          ok: false,
          error: "Rule not found",
          code: "rule_not_found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          rule: provenance.rule,
          sources: provenance.sources,
          source_count: provenance.sources.length,
          verified_sources: provenance.sources.filter(
            (s) => s.source.confidence_level === "verified"
          ).length,
          unverified_sources: provenance.sources.filter(
            (s) => s.source.confidence_level === "pending"
          ).length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/rules/[id]/sources] Error:", error);

    // Check if it's a not-found error from Supabase RLS
    if (
      error instanceof Error &&
      (error.message.includes("policy") ||
        error.message.includes("not found"))
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Rule not found or access denied",
          code: "rule_not_found_or_forbidden",
        },
        { status: 404 }
      );
    }

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
