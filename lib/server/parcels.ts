/**
 * Server-side helper to query paginated parcels for a given workspace.
 * Replace the DB client with your project's DB helper. Keep queries parameterized.
 *
 * Responsibilities:
 * - Enforce workspace scoping (workspace_id filter)
 * - Validate page number and calculate offsets
 * - Apply sorting, searching, filtering
 * - Return strictly typed PaginatedResult
 * - Log errors for audit/debugging
 *
 * Used by:
 * - app/parcels/page/[pageNum]/page.tsx (server component)
 * - app/api/parcels/route.ts (if you build an API endpoint)
 */

import type { Parcel, PaginatedResult, ParcelsQueryParams } from '@/lib/contracts/parcel';
import { supabaseAdmin } from './supabaseServer';

/**
 * Query paginated parcels for a workspace.
 *
 * @param params Query parameters (workspaceId, page, pageSize, etc.)
 * @returns PaginatedResult containing items, pagination metadata
 * @throws Error if query fails (caller should handle gracefully)
 */
export async function getPaginatedParcels(
  params: ParcelsQueryParams
): Promise<PaginatedResult<Parcel>> {
  const {
    workspaceId,
    page = 1,
    pageSize = 20,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    search,
    status,
  } = params;

  // Validate inputs
  if (page < 1) {
    throw new Error('Page number must be >= 1');
  }
  if (pageSize < 1 || pageSize > 100) {
    throw new Error('Page size must be between 1 and 100');
  }

  const offset = (page - 1) * pageSize;
  const safeSortCol = sortBy === 'createdAt' ? 'created_at' : sortBy === 'updatedAt' ? 'updated_at' : 'id';
  const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  try {
    // Build base query
    let query = supabaseAdmin
      .from('parcels')
      .select('id,apn,address,jurisdiction,centroid,updated_at', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      // Search across multiple fields with ILIKE
      const searchPattern = `%${search}%`;
      query = query.or(`name.ilike.${searchPattern},address.ilike.${searchPattern},apn.ilike.${searchPattern}`);
    }

    query = query.order(safeSortCol, { ascending: safeSortOrder === 'asc' });
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('getPaginatedParcels supabase error', error);
      throw new Error('Failed to fetch parcels');
    }

    const items: Parcel[] = (data || []).map((r: any) => ({
      id: r.id,
      workspaceId: workspaceId,
      userId: '', // TODO: Get from auth context
      name: r.address || 'Parcel',
      geometry: null, // TODO: Fetch from geometry column
      apn: r.apn ?? undefined,
      address: r.address ?? undefined,
      jurisdiction: r.jurisdiction ?? undefined,
      centroid: r.centroid ?? null,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
    } as Parcel));

    const total = Number(count ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      page,
      totalPages,
      total,
      pageSize,
      hasNextPage,
      hasPreviousPage,
    };
  } catch (err) {
    console.error('getPaginatedParcels unexpected error', err);
    throw err instanceof Error ? err : new Error('Unexpected error fetching parcels');
  }
}

/**
 * Helper: Validate that a user has access to a specific parcel.
 * Called by detail pages, edit pages, etc. before returning sensitive data.
 *
 * @param parcelId Parcel UUID
 * @param workspaceId Workspace UUID
 * @param userId User UUID (optional: if null, just check workspace ownership)
 * @returns true if user can access, false otherwise
 */
export async function canAccessParcel(
  parcelId: string,
  workspaceId: string,
  userId?: string
): Promise<boolean> {
  if (!parcelId || !workspaceId) return false;

  try {
    const { data, error } = await supabaseAdmin
      .from('parcels')
      .select('id')
      .eq('id', parcelId)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('canAccessParcel error', error);
      return false;
    }
    if (!data) return false;

    if (!userId) return true;

    // Optionally confirm workspace membership of the user
    const { data: member, error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (memberError) {
      console.error('workspace_members lookup error', memberError);
      return false;
    }

    return Boolean(member);
  } catch (err) {
    console.error('canAccessParcel unexpected error', err);
    return false;
  }
}

/**
 * Helper: Count parcels in a workspace (for dashboard stats, etc.)
 *
 * @param workspaceId Workspace UUID
 * @param status Optional status filter
 * @returns Count of parcels
 */
export async function countParcels(
  workspaceId: string,
  status?: 'draft' | 'active' | 'archived'
): Promise<number> {
  if (!workspaceId) return 0;

  try {
    let query = supabaseAdmin
      .from('parcels')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null);

    if (status) {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) {
      console.error('countParcels error', error);
      return 0;
    }

    return Number(count ?? 0);
  } catch (err) {
    console.error('countParcels unexpected error', err);
    return 0;
  }
}

/**
 * IMPORTANT: Entitlement Checks
 *
 * Consider adding entitlement validation here or in the server component:
 *
 * 1. If parcel listing is feature-gated (e.g., ccp-06:parcel-management):
 *    - Check user's entitlement before querying DB
 *    - Return early with 403 or redirect to UnlockDetails paywall
 *
 * 2. If individual parcel visibility is tier-dependent:
 *    - Filter results by entitlement (e.g., free tier sees only first 5, Pro sees all)
 *    - Add "locked" property to Parcel interface if needed
 *
 * Example:
 *   import { checkEntitlement } from '@/lib/services/entitlements';
 *   const canViewParcels = await checkEntitlement(workspaceId, 'ccp-06:parcel-management');
 *   if (!canViewParcels) throw new Error('Not entitled to view parcels');
 *
 * See docs/CCP05-ENTITLEMENTS-HARDENING.md for details.
 */
