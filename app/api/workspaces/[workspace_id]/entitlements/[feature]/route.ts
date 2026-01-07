// CCP-05 Entitlement Check Route
// GET /api/workspaces/[workspace_id]/entitlements/[feature]
// Server-authoritative entitlement resolution

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getEntitlementStatus } from '@/lib/services/entitlements';
import { isValidFeature } from '@/lib/contracts/ccp05/entitlements';
import type { EntitlementFeature } from '@/lib/contracts/ccp05/entitlements';

interface ParsedParams {
  workspace_id: string;
  feature: string;
}

/**
 * GET /api/workspaces/[workspace_id]/entitlements/[feature]
 *
 * HARDENING:
 * 1. Auth: user must be logged in
 * 2. Membership: user must be workspace member
 * 3. Feature Validation: feature must be valid
 * 4. Server-Authoritative: resolve on server only
 * 5. Caching: 5-minute TTL for performance
 * 6. Auditing: log all checks (best-effort)
 *
 * RESPONSE:
 * {
 *   "feature": "ccp-06:branded-reports",
 *   "enabled": true,
 *   "tier": "pro",
 *   "reason": null,
 *   "cached": true,
 *   "resolvedAt": "2026-01-06T12:00:00Z",
 *   "cacheTtlRemaining": 280
 * }
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<ParsedParams> }
) {
  try {
    const { workspace_id, feature } = await params;

    // === STEP 1: Auth ===
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

    // === STEP 2: Workspace Membership ===
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

    // === STEP 3: Validate Feature ===
    if (!isValidFeature(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature' },
        { status: 400 }
      );
    }

    // === STEP 4: Server-Authoritative Check ===
    const result = await getEntitlementStatus(
      workspace_id,
      feature as EntitlementFeature,
      user.id
    );

    // === STEP 5: Return Result ===
    return NextResponse.json(
      {
        feature: result.feature,
        enabled: result.enabled,
        tier: result.tier,
        reason: result.reason,
        cached: result.cached,
        resolvedAt: result.resolvedAt.toISOString(),
        cacheTtlRemaining: result.cacheTtlRemaining,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[entitlements/[feature]] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
