import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Report, ReportBranding, ReportStatus } from "@/lib/contracts/ccp06/report.schema";
import { ReportSchema, ReportBrandingSchema } from "@/lib/contracts/ccp06/report.schema";
import { resolveBrandingFromWorkspace } from "@/lib/contracts/ccp06/branding";

// ============================================================================
// CCP-06: Branded Reports Database Helpers
// ============================================================================
// FROZEN FUNCTIONS - Do not modify without version bump
// These helpers enforce:
//   1. Workspace isolation via RLS
//   2. Schema validation (Zod)
//   3. Immutable report contracts (report.schema.ts v1.0)
//   4. Branding cascade from workspace metadata
// ============================================================================

interface CreateBrandedReportInput {
  workspace_id: string;
  name: string;
  status?: ReportStatus;
  projection: {
    parcel_id: string;
    location: { lat: number; lng: number };
    intent: string;
  };
  branding?: ReportBranding;
}

interface UpdateBrandedReportInput {
  id: string;
  workspace_id: string;
  name?: string;
  status?: ReportStatus;
  branding?: Partial<ReportBranding>;
}

interface ListBrandedReportsOptions {
  workspace_id: string;
  status?: ReportStatus;
  limit?: number;
  offset?: number;
}

/**
 * Create a new branded report in workspace
 *
 * Access Control:
 *   - Caller responsibility: Verify caller is workspace admin/owner before calling
 *   - RLS will enforce at DB layer
 *
 * Validation:
 *   - name: 1-255 chars
 *   - projection: parcel_id, location (lat/lng), intent required
 *   - branding: workspace_name required (resolved from workspace metadata)
 *
 * @param input - Report creation input
 * @returns Created report with id, created_at, updated_at
 * @throws ValidationError if schema validation fails
 * @throws DatabaseError if RLS blocks access or insert fails
 */
export async function createBrandedReport(
  input: CreateBrandedReportInput
): Promise<Report> {
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

  // Validate input against frozen schema
  const name = input.name.trim();
  if (!name || name.length > 255) {
    throw new Error("VALIDATION_ERROR: name must be 1-255 characters");
  }

  // Validate projection (required fields)
  const { parcel_id, location, intent } = input.projection;
  if (!parcel_id || !location || !location.lat || !location.lng || !intent) {
    throw new Error("VALIDATION_ERROR: projection missing required fields");
  }

  // Get workspace for branding cascade
  const { data: workspaceData, error: workspaceError } = await client
    .from("workspaces")
    .select("id, name, metadata")
    .eq("id", input.workspace_id)
    .single();

  if (workspaceError || !workspaceData) {
    throw new Error("WORKSPACE_NOT_FOUND: Workspace does not exist");
  }

  // Resolve branding from workspace or use provided override
  const branding = input.branding || resolveBrandingFromWorkspace(workspaceData);

  // Validate branding against schema
  const brandingValidation = ReportBrandingSchema.safeParse(branding);
  if (!brandingValidation.success) {
    throw new Error(`VALIDATION_ERROR: ${brandingValidation.error.message}`);
  }

  // Insert report
  const { data, error } = await client
    .from("branded_reports")
    .insert({
      workspace_id: input.workspace_id,
      name,
      status: input.status || "draft",
      projection: input.projection,
      branding: brandingValidation.data,
    })
    .select()
    .single();

  if (error) {
    // RLS violation returns 403 "new row violates row level security policy"
    if (error.message.includes("row level security")) {
      throw new Error("WORKSPACE_ACCESS_DENIED: RLS check failed");
    }
    throw error;
  }

  // Validate response against frozen schema
  const reportValidation = ReportSchema.safeParse(data);
  if (!reportValidation.success) {
    throw new Error(`DATABASE_SCHEMA_MISMATCH: ${reportValidation.error.message}`);
  }

  return reportValidation.data;
}

/**
 * Get a single branded report by ID
 *
 * Access Control:
 *   - RLS enforces workspace membership
 *   - Non-members get no result (indistinguishable from not-found)
 *
 * @param reportId - UUID of report
 * @param workspaceId - UUID of workspace (for context, RLS checks this)
 * @returns Report or null if not found / no access
 */
export async function getBrandedReport(
  reportId: string,
  workspaceId: string
): Promise<Report | null> {
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
    .from("branded_reports")
    .select("*")
    .eq("id", reportId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) {
    // PGRST116 = no rows returned
    if (error.code === "PGRST116") {
      return null;
    }
    // RLS violation
    if (error.message.includes("row level security")) {
      return null;
    }
    throw error;
  }

  // Validate response
  const reportValidation = ReportSchema.safeParse(data);
  if (!reportValidation.success) {
    throw new Error(`DATABASE_SCHEMA_MISMATCH: ${reportValidation.error.message}`);
  }

  return reportValidation.data;
}

/**
 * List all branded reports in a workspace
 *
 * Access Control:
 *   - RLS enforces workspace membership
 *   - Non-members get empty list
 *
 * Pagination:
 *   - limit: max 100, default 50
 *   - offset: default 0
 *
 * @param options - List options (workspace_id, status filter, pagination)
 * @returns Reports array and total count
 */
export async function listBrandedReports(
  options: ListBrandedReportsOptions
): Promise<{ reports: Report[]; total: number }> {
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

  const limit = Math.min(options.limit || 50, 100);
  const offset = options.offset || 0;

  let query = client
    .from("branded_reports")
    .select("*", { count: "exact" })
    .eq("workspace_id", options.workspace_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  // Validate all responses
  const reports: Report[] = [];
  for (const item of data || []) {
    const validation = ReportSchema.safeParse(item);
    if (!validation.success) {
      console.error("Invalid report from DB:", item, validation.error);
      continue;
    }
    reports.push(validation.data);
  }

  return {
    reports,
    total: count || 0,
  };
}

/**
 * Update a branded report
 *
 * Access Control:
 *   - Caller responsibility: Verify caller is workspace admin/owner before calling
 *   - RLS will enforce at DB layer
 *
 * Immutability Notes:
 *   - Cannot change workspace_id (frozen after creation)
 *   - Cannot change projection (frozen after creation)
 *   - Can update: name, status, branding
 *
 * @param input - Update input
 * @returns Updated report
 * @throws ValidationError if schema validation fails
 * @throws DatabaseError if RLS blocks access or update fails
 */
export async function updateBrandedReport(
  input: UpdateBrandedReportInput
): Promise<Report> {
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

  const updates: Record<string, any> = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name || name.length > 255) {
      throw new Error("VALIDATION_ERROR: name must be 1-255 characters");
    }
    updates.name = name;
  }

  if (input.status !== undefined) {
    const validStatuses = ["draft", "published", "archived"];
    if (!validStatuses.includes(input.status)) {
      throw new Error(`VALIDATION_ERROR: invalid status "${input.status}"`);
    }
    updates.status = input.status;
  }

  if (input.branding !== undefined) {
    const validation = ReportBrandingSchema.partial().safeParse(input.branding);
    if (!validation.success) {
      throw new Error(`VALIDATION_ERROR: ${validation.error.message}`);
    }
    // Merge with existing branding (get current first)
    const current = await getBrandedReport(input.id, input.workspace_id);
    if (current) {
      updates.branding = { ...current.branding, ...validation.data };
    }
  }

  const { data, error } = await client
    .from("branded_reports")
    .update(updates)
    .eq("id", input.id)
    .eq("workspace_id", input.workspace_id)
    .select()
    .single();

  if (error) {
    if (error.message.includes("row level security")) {
      throw new Error("WORKSPACE_ACCESS_DENIED: RLS check failed");
    }
    if (error.code === "PGRST116") {
      throw new Error("NOT_FOUND: Report does not exist");
    }
    throw error;
  }

  const reportValidation = ReportSchema.safeParse(data);
  if (!reportValidation.success) {
    throw new Error(`DATABASE_SCHEMA_MISMATCH: ${reportValidation.error.message}`);
  }

  return reportValidation.data;
}

/**
 * Delete a branded report
 *
 * Access Control:
 *   - Caller responsibility: Verify caller is workspace admin/owner before calling
 *   - RLS will enforce at DB layer
 *
 * @param reportId - UUID of report to delete
 * @param workspaceId - UUID of workspace (RLS enforcement)
 * @throws DatabaseError if RLS blocks access or delete fails
 */
export async function deleteBrandedReport(
  reportId: string,
  workspaceId: string
): Promise<void> {
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

  const { error } = await client
    .from("branded_reports")
    .delete()
    .eq("id", reportId)
    .eq("workspace_id", workspaceId);

  if (error) {
    if (error.message.includes("row level security")) {
      throw new Error("WORKSPACE_ACCESS_DENIED: RLS check failed");
    }
    throw error;
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Test helper: Get all reports in a workspace (no pagination)
 * Only for testing - production should use listBrandedReports with pagination
 */
export async function getAllReportsForWorkspace(
  workspaceId: string
): Promise<Report[]> {
  const result = await listBrandedReports({
    workspace_id: workspaceId,
    limit: 1000,
  });
  return result.reports;
}
