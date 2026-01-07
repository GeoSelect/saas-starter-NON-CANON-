// C046 UnlockDetails — upgrade resolver (CCP-06, CCP-14)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { UpgradeOption } from '@/lib/contracts/upgrade';
import type { FeatureId } from '@/lib/contracts/entitlements';

const UPGRADE_PATHS: Record<FeatureId, Record<string, UpgradeOption>> = {
  'ccp-06:branded-reports': {
    free: {
      from: 'free',
      to: 'pro',
      feature: 'ccp-06:branded-reports',
      plan: {
        name: 'Pro',
        price: 7499,
        interval: 'month',
        stripePriceId: 'price_pro_monthly',
      },
      upgradeUrl: 'https://checkout.stripe.com/...',
    },
    pro: {
      from: 'pro',
      to: 'portfolio',
      feature: 'ccp-06:branded-reports',
      plan: {
        name: 'Portfolio',
        price: 49900,
        interval: 'month',
        stripePriceId: 'price_portfolio_monthly',
      },
      upgradeUrl: 'https://checkout.stripe.com/...',
    },
  },
  'ccp-09:crm-sync': {
    free: {
      from: 'free',
      to: 'pro-plus',
      feature: 'ccp-09:crm-sync',
      plan: {
        name: 'Pro+ CRM',
        price: 19900,
        interval: 'month',
        stripePriceId: 'price_pro_plus_crm_monthly',
      },
      upgradeUrl: 'https://checkout.stripe.com/...',
    },
  },
  // ... more features
  'ccp-03:report-generation': {},
  'ccp-04:report-sharing': {},
  'ccp-14:premium-unlock': {},
  'ccp-15:export-workspace': {},
};

export async function POST(req: NextRequest) {
  try {
    // C046: Get authenticated user
    const cookieStore = req.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ upgrade: null }, { status: 200 });
    }

    // Parse request
    const { featureId, workspaceId } = await req.json();

    // Fetch workspace tier
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('tier')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ upgrade: null }, { status: 403 });
    }

    // C046: Determine upgrade path (server-authoritative)
    const paths = UPGRADE_PATHS[featureId as FeatureId];
    const upgrade = paths?.[workspace.tier] ?? null;

    return NextResponse.json({ upgrade }, { status: 200 });
  } catch (err) {
    console.error('[C046] Upgrade resolver error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
