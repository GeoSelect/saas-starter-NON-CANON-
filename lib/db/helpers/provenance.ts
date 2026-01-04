import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type {
  Source,
  DataGap,
  Rule,
  RuleSource,
} from "@/lib/workspace/sources-rules";

// ============================================================================
// Provenance Tracking Helpers
// ============================================================================

/**
 * Get all sources cited for a specific rule
 * Returns source details with citation information
 */
export async function getRuleSources(ruleId: string): Promise<Source[]> {
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

  // Get rule sources with full source details
  const { data, error } = await client
    .from("rule_sources")
    .select(
      `
      sources (
        id,
        name,
        type,
        url,
        jurisdiction,
        confidence_level,
        last_verified_at,
        created_at,
        updated_at
      ),
      citation,
      citation_date
    `
    )
    .eq("rule_id", ruleId);

  if (error) throw error;

  // Extract and return source objects
  return (data || [])
    .filter((item): item is { sources: Source } => item.sources !== null)
    .map((item) => item.sources);
}

/**
 * Get all data gaps in a workspace with full details
 * Useful for dashboard views and gap resolution workflows
 */
export async function getWorkspaceGaps(
  workspaceId: string
): Promise<DataGap[]> {
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

  const { data, error } = await client
    .from("data_gaps")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Identify missing information in a workspace
 * Returns only gaps with gap_type = 'missing'
 */
export async function identifyMissingInfo(
  workspaceId: string
): Promise<DataGap[]> {
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

  const { data, error } = await client
    .from("data_gaps")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("gap_type", "missing")
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================================================
// Advanced Provenance Helpers
// ============================================================================

/**
 * Get complete rule provenance: rule definition + all sources + citations
 */
export async function getRuleProvenance(ruleId: string): Promise<{
  rule: Rule | null;
  sources: (RuleSource & { source: Source })[];
}> {
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

  // Get rule
  const { data: ruleData, error: ruleError } = await client
    .from("rules")
    .select("*")
    .eq("id", ruleId)
    .single();

  if (ruleError) throw ruleError;

  // Get sources with citations
  const { data: sourcesData, error: sourcesError } = await client
    .from("rule_sources")
    .select(
      `
      rule_id,
      source_id,
      citation,
      citation_date,
      sources (
        id,
        name,
        type,
        url,
        jurisdiction,
        confidence_level,
        last_verified_at
      )
    `
    )
    .eq("rule_id", ruleId);

  if (sourcesError) throw sourcesError;

  return {
    rule: ruleData,
    sources: (sourcesData || [])
      .filter(
        (item): item is typeof sourcesData[0] & { sources: Source } =>
          item.sources !== null
      )
      .map((item) => ({
        rule_id: item.rule_id,
        source_id: item.source_id,
        citation: item.citation,
        citation_date: item.citation_date,
        source: item.sources,
      })),
  };
}

/**
 * Get gaps by severity level for a workspace
 * Helps prioritize gap resolution
 */
export async function getGapsBySeverity(
  workspaceId: string,
  severity: "critical" | "warning" | "info"
): Promise<DataGap[]> {
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

  const { data, error } = await client
    .from("data_gaps")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("severity", severity)
    .eq("resolution_status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get unverified sources in a workspace
 * Returns sources with confidence_level = 'pending'
 */
export async function getUnverifiedSources(): Promise<Source[]> {
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

  const { data, error } = await client
    .from("sources")
    .select("*")
    .eq("confidence_level", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get gap resolution summary for a workspace
 * Shows open, investigating, and resolved gap counts by type
 */
export async function getGapResolutionSummary(
  workspaceId: string
): Promise<{
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
}> {
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

  const { data, error } = await client
    .from("data_gaps")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  const gaps = data || [];
  const summary = {
    total: gaps.length,
    open: gaps.filter((g) => g.resolution_status === "open").length,
    investigating: gaps.filter((g) => g.resolution_status === "investigating")
      .length,
    resolved: gaps.filter((g) => g.resolution_status === "resolved").length,
    by_type: {} as Record<string, number>,
    by_severity: {} as Record<string, number>,
  };

  // Count by type
  gaps.forEach((gap) => {
    summary.by_type[gap.gap_type] = (summary.by_type[gap.gap_type] || 0) + 1;
  });

  // Count by severity
  gaps.forEach((gap) => {
    summary.by_severity[gap.severity] =
      (summary.by_severity[gap.severity] || 0) + 1;
  });

  return summary;
}

/**
 * Get rules without sources (orphaned rules)
 * Useful for ensuring all rules are properly cited
 */
export async function getRulesWithoutSources(
  workspaceId: string
): Promise<Rule[]> {
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

  // Get all rules in workspace
  const { data: rulesData, error: rulesError } = await client
    .from("rules")
    .select("id")
    .eq("workspace_id", workspaceId);

  if (rulesError) throw rulesError;

  const ruleIds = rulesData?.map((r) => r.id) || [];

  if (ruleIds.length === 0) return [];

  // Get rules that have sources
  const { data: citedRuleIds, error: citedError } = await client
    .from("rule_sources")
    .select("rule_id")
    .in("rule_id", ruleIds);

  if (citedError) throw citedError;

  const citedIds = new Set(citedRuleIds?.map((r) => r.rule_id) || []);
  const orphanedIds = ruleIds.filter((id) => !citedIds.has(id));

  if (orphanedIds.length === 0) return [];

  // Get full rule details for orphaned rules
  const { data: orphanedRules, error: orphanedError } = await client
    .from("rules")
    .select("*")
    .in("id", orphanedIds);

  if (orphanedError) throw orphanedError;
  return orphanedRules || [];
}

/**
 * Get parcel-specific provenance
 * Shows all rules and gaps for a specific parcel
 */
export async function getParcelProvenance(
  workspaceId: string,
  parcelId: string
): Promise<{
  rules: Rule[];
  gaps: DataGap[];
  gap_summary: { missing: number; conflicts: number; outdated: number };
}> {
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

  // Get rules for parcel
  const { data: rulesData, error: rulesError } = await client
    .from("rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("parcel_id", parcelId);

  if (rulesError) throw rulesError;

  // Get gaps for parcel
  const { data: gapsData, error: gapsError } = await client
    .from("data_gaps")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("parcel_id", parcelId);

  if (gapsError) throw gapsError;

  const gaps = gapsData || [];
  const gap_summary = {
    missing: gaps.filter((g) => g.gap_type === "missing").length,
    conflicts: gaps.filter((g) => g.gap_type === "conflict").length,
    outdated: gaps.filter((g) => g.gap_type === "outdated").length,
  };

  return {
    rules: rulesData || [],
    gaps,
    gap_summary,
  };
}

/**
 * Get all rules for a snapshot (for shared reports)
 * Returns rules with their sources
 */
export async function getSnapshotRules(snapshotId: string) {
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

  const { data, error } = await client
    .from("snapshot_rules")
    .select(
      `
      *,
      snapshot_sources (
        id,
        name,
        type,
        citation,
        confidence_level
      )
    `
    )
    .eq("snapshot_id", snapshotId);

  if (error) {
    console.error("Error fetching snapshot rules:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all data gaps for a snapshot (for shared reports)
 */
export async function getSnapshotGaps(snapshotId: string) {
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

  const { data, error } = await client
    .from("snapshot_gaps")
    .select("*")
    .eq("snapshot_id", snapshotId);

  if (error) {
    console.error("Error fetching snapshot gaps:", error);
    return [];
  }

  return data || [];
}
