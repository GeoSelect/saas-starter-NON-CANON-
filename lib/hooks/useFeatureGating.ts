/**
 * Feature Gating Hook
 * React hook for checking feature access based on user's subscription plan
 */

'use client';

import { useCallback, useMemo } from 'react';
import { hasFeature, getMinPlanForFeature, getUpgradeFeatures, FeatureId, PlanType } from '@/lib/features';

interface UseFeatureGatingProps {
  userPlan?: PlanType;
}

interface FeatureAccessResult {
  hasAccess: boolean;
  minPlanRequired: PlanType;
  upgradeRequired: boolean;
  feature: FeatureId;
}

export function useFeatureGating(props?: UseFeatureGatingProps) {
  const userPlan = props?.userPlan || 'browse';

  /**
   * Check if user has access to a specific feature
   */
  const checkFeature = useCallback((featureId: FeatureId): FeatureAccessResult => {
    const hasAccess = hasFeature(userPlan, featureId);
    const minPlanRequired = getMinPlanForFeature(featureId);

    return {
      hasAccess,
      minPlanRequired,
      upgradeRequired: !hasAccess,
      feature: featureId,
    };
  }, [userPlan]);

  /**
   * Get all features user can upgrade to
   */
  const upgradeFeatures = useMemo(() => {
    return getUpgradeFeatures(userPlan);
  }, [userPlan]);

  /**
   * Get list of features user doesn't have access to (for upgrade prompts)
   */
  const lockedFeatures = useMemo(() => {
    const lockedFeatureIds: FeatureId[] = upgradeFeatures.map(f => f.id);
    return lockedFeatureIds;
  }, [upgradeFeatures]);

  return {
    checkFeature,
    hasAccess: (featureId: FeatureId) => checkFeature(featureId).hasAccess,
    upgradeFeatures,
    lockedFeatures,
    userPlan,
  };
}

/**
 * Render children only if user has access to a feature
 */
export function FeatureGate({
  feature,
  userPlan = 'browse',
  fallback,
  children,
}: {
  feature: FeatureId;
  userPlan?: PlanType;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactNode {
  const hasAccess = hasFeature(userPlan, feature);

  if (!hasAccess) {
    return fallback ?? null;
  }

  return children;
}
