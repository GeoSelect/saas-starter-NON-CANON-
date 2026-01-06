// CCP-05 Entitlements List Route
// GET /api/workspaces/[workspace_id]/entitlements
// Fetch all enabled entitlements for UI feature visibility

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkMultipleEntitlements } from '@/lib/services/entitlements';
import { TIER_REQUIREMENTS } from '@/lib/contracts/ccp05/entitlements';
import type { EntitlementFeature } from '@/lib/contracts/ccp05/entitlements';

interface ParsedParams {
  workspace_id: string;
}

/**
 * GET /api/workspaces/[workspace_id]/entitlements
 *
 * Fetch all entitlements for workspace in batch
 * Useful for UI to show/hide features at once
 *
 * RESPONSE:
 * {
 *   "features": {
 *     "ccp-01:parcel-discovery": { "enabled": true, "tier": "free", ... },
 *     "ccp-06:branded-reports": { "enabled": false, "reason": "TIER_INSUFFICIENT", ... },
 *     ...
 *   },
 *   "tier": "pro",
 *   "cacheHitRate": 95
 * }
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<ParsedParams> }
) {
  try {
    const { workspace_id } = await params;

    // === Auth ===
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // In middleware
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // === Workspace Membership ===
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // === Get Billing State ===
    const { data: billing } = await supabase
      .from('billing_state')
      .select('tier')
      .eq('workspace_id', workspace_id)
      .single();

    const tier = billing?.tier || 'free';

    // === Check All Features ===
    const allFeatures = Object.keys(TIER_REQUIREMENTS) as EntitlementFeature[];
    const results = await checkMultipleEntitlements(workspace_id, allFeatures, user.id);

    // === Calculate Cache Stats ===
    const cachedCount = Object.values(results).filter((r) => r.cached).length;
    const cacheHitRate = Math.round((cachedCount / allFeatures.length) * 100);

    // === Return Results ===
    return NextResponse.json(
      {
        features: results,
        tier,
        cacheHitRate,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[entitlements] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
