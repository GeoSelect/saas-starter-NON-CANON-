// C046 UnlockDetails — upgrade state contract (CCP-06, CCP-14)
import type { SubscriptionTier } from './workspace';

export interface UpgradeOption {
  from: SubscriptionTier;
  to: SubscriptionTier;
  feature: string; // CCP code, e.g., 'ccp-06:branded-reports'
  plan: {
    name: string; // 'Pro', 'Pro+ CRM', etc.
    price: number; // cents, e.g., 7499
    interval: 'month' | 'year';
    stripePriceId: string;
  };
  upgradeUrl: string; // Stripe checkout or subscription page
  saving?: string; // e.g., '20% off annual'
}

export interface BlockedAccessLog {
  id: string; // UUID
  userId: string;
  workspaceId: string;
  featureId: string; // CCP code
  tier: SubscriptionTier;
  reason: 'upgrade_required' | 'feature_not_available';
  upgradeOption?: UpgradeOption;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string; // for audit
}

export function isUpgradeOption(value: unknown): value is UpgradeOption {
  return (
    typeof value === 'object' &&
    value !== null &&
    'from' in value &&
    'to' in value &&
    'plan' in value &&
    'upgradeUrl' in value
  );
}
