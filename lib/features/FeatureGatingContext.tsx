'use client';

import React, { createContext, useContext } from 'react';
import { PlanType, FeatureId } from '@/lib/features';
import { useFeatureGating } from '@/lib/hooks/useFeatureGating';

interface FeatureGatingContextType {
  userPlan: PlanType;
  hasAccess: (featureId: FeatureId) => boolean;
  checkFeature: (featureId: FeatureId) => any;
  upgradeFeatures: any[];
  lockedFeatures: FeatureId[];
}

const FeatureGatingContext = createContext<FeatureGatingContextType | undefined>(undefined);

export function FeatureGatingProvider({
  children,
  userPlan = 'browse',
}: {
  children: React.ReactNode;
  userPlan?: PlanType;
}) {
  const featureGating = useFeatureGating({ userPlan });

  return (
    <FeatureGatingContext.Provider value={{
      userPlan,
      hasAccess: featureGating.hasAccess,
      checkFeature: featureGating.checkFeature,
      upgradeFeatures: featureGating.upgradeFeatures,
      lockedFeatures: featureGating.lockedFeatures,
    }}>
      {children}
    </FeatureGatingContext.Provider>
  );
}

export function useFeatureGatingContext() {
  const context = useContext(FeatureGatingContext);
  if (!context) {
    throw new Error('useFeatureGatingContext must be used within FeatureGatingProvider');
  }
  return context;
}
