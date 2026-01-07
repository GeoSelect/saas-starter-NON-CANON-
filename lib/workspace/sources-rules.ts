import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ============================================================================
// Types
// ============================================================================

export interface Source {
  id: string;
  name: string;
  type: "hoa_ccr" | "jurisdiction_code" | "ordinance" | "county_records" | "assessor" | "zoning" | "custom";
  url?: string;
  jurisdiction?: string;
  last_verified_at?: string;
  confidence_level: "verified" | "inferred" | "pending";
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  workspace_id: string;
  parcel_id?: string;
  rule_type: "setback" | "height_limit" | "density" | "use_restriction" | "parking" | "other";
  description: string;
  details?: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RuleSource {
  rule_id: string;
  source_id: string;
  citation?: string;
  citation_date?: string;
}

export interface DataGap {
  id: string;
  workspace_id: string;
  parcel_id?: string;
  gap_type: "missing" | "conflict" | "outdated" | "unverified";
  description: string;
  severity: "critical" | "warning" | "info";
  resolution_status: "open" | "investigating" | "resolved";
  reported_by?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// ============================================================================
// Sources Helpers
// ============================================================================

/**
 * Get all sources with optional filtering
 */
export async function getSources(filters?: {
  type?: string;
  jurisdiction?: string;
  confidenceLevel?: "verified" | "inferred" | "pending";
}): Promise<Source[]> {
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

  let query = client.from("sources").select("*");

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.jurisdiction) {
    query = query.eq("jurisdiction", filters.jurisdiction);
  }
  if (filters?.confidenceLevel) {
    query = query.eq("confidence_level", filters.confidenceLevel);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Create a new source
 */
export async function createSource(
  name: string,
  type: string,
  options?: {
    url?: string;
    jurisdiction?: string;
    confidence_level?: "verified" | "inferred" | "pending";
  }
): Promise<Source> {
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
    .insert([
      {
        name,
        type,
        url: options?.url,
        jurisdiction: options?.jurisdiction,
        confidence_level: options?.confidence_level || "pending",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Verify a source (update confidence level and verification timestamp)
 */
export async function verifySource(sourceId: string): Promise<Source> {
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
    .update({
      confidence_level: "verified",
      last_verified_at: new Date().toISOString(),
    })
    .eq("id", sourceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// Rules Helpers
// ============================================================================

/**
 * Create a new rule in a workspace
 */
export async function createRule(
  workspaceId: string,
  ruleType: string,
  description: string,
  options?: {
    parcel_id?: string;
    details?: Record<string, any>;
  }
): Promise<Rule> {
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

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data, error } = await client
    .from("rules")
    .insert([
      {
        workspace_id: workspaceId,
        rule_type: ruleType,
        description,
        parcel_id: options?.parcel_id,
        details: options?.details || {},
        created_by: user.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get rules for a workspace, optionally filtered by parcel
 */
export async function getRules(
  workspaceId: string,
  parcelId?: string
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

  let query = client
    .from("rules")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (parcelId) {
    query = query.eq("parcel_id", parcelId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Link a rule to a source (create citation)
 */
export async function linkRuleToSource(
  ruleId: string,
  sourceId: string,
  citation?: string
): Promise<RuleSource> {
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
    .from("rule_sources")
    .insert([
      {
        rule_id: ruleId,
        source_id: sourceId,
        citation,
        citation_date: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get sources for a specific rule
 */
export async function getRuleSources(ruleId: string): Promise<
  (RuleSource & {
    sources?: Source[];
  })[]
> {
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
        confidence_level,
        created_at,
        updated_at
      )
    `
    )
    .eq("rule_id", ruleId);

  if (error) throw error;
  // Patch sources to include required fields for Source type
  return (data || []).map((item: any) => ({
    ...item,
    sources: item.sources?.map((src: any) => ({
      ...src,
      created_at: src.created_at || '',
      updated_at: src.updated_at || '',
    }))
  }));
}

// ============================================================================
// Data Gaps Helpers
// ============================================================================

/**
 * Report a data gap for a workspace/parcel
 */
export async function reportDataGap(
  workspaceId: string,
  gapType: "missing" | "conflict" | "outdated" | "unverified",
  description: string,
  options?: {
    parcel_id?: string;
    severity?: "critical" | "warning" | "info";
  }
): Promise<DataGap> {
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

  const {
    data: { user },
  } = await client.auth.getUser();

  const { data, error } = await client
    .from("data_gaps")
    .insert([
      {
        workspace_id: workspaceId,
        gap_type: gapType,
        description,
        parcel_id: options?.parcel_id,
        severity: options?.severity || "info",
        reported_by: user?.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get data gaps for a workspace, optionally filtered by parcel
 */
export async function getDataGaps(
  workspaceId: string,
  filters?: {
    parcel_id?: string;
    gap_type?: string;
    severity?: string;
    resolution_status?: string;
  }
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

  let query = client
    .from("data_gaps")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (filters?.parcel_id) {
    query = query.eq("parcel_id", filters.parcel_id);
  }
  if (filters?.gap_type) {
    query = query.eq("gap_type", filters.gap_type);
  }
  if (filters?.severity) {
    query = query.eq("severity", filters.severity);
  }
  if (filters?.resolution_status) {
    query = query.eq("resolution_status", filters.resolution_status);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Update data gap resolution status
 */
export async function updateDataGapStatus(
  gapId: string,
  status: "open" | "investigating" | "resolved"
): Promise<DataGap> {
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
    .update({
      resolution_status: status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", gapId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
