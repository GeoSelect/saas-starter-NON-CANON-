'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PlanType = 'basic' | 'pro_crm' | 'pro_ai' | 'portfolio' | 'enterprise' | null;

export const PLAN_NAMES: Record<PlanType, string> = {
  basic: 'Pro',
  pro_crm: 'Pro+ CRM',
  pro_ai: 'Pro+ AI',
  portfolio: 'Portfolio',
  enterprise: 'Enterprise',
  null: 'Anonymous',
};

// Plan entitlements - define which features are available in each plan
export const PLAN_ENTITLEMENTS: Record<Exclude<PlanType, null>, string[]> = {
  basic: ['analytics'],
  pro_crm: ['analytics', 'crm', 'workflows'],
  pro_ai: ['analytics', 'crm', 'workflows', 'ai_insights', 'auto_entry'],
  portfolio: ['analytics', 'crm', 'workflows', 'ai_insights', 'auto_entry', 'portfolio'],
  enterprise: ['analytics', 'crm', 'workflows', 'ai_insights', 'auto_entry', 'portfolio', 'custom_integrations', 'sla_support'],
};

interface AuthContextType {
  currentPlan: PlanType;
  isLoggedIn: boolean;
  userEmail: string | null;
  workspaceName: string | null;
  setPlan: (plan: PlanType) => void;
  logout: () => void;
  hasEntitlement: (feature: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<PlanType>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  const isLoggedIn = currentPlan !== null;

  const setPlan = (plan: PlanType) => {
    setCurrentPlan(plan);
    if (plan !== null) {
      // In a real app, you'd get this from the user session
      setUserEmail('user@example.com');
      setWorkspaceName('Demo Workspace');
    }
  };

  const logout = () => {
    setCurrentPlan(null);
    setUserEmail(null);
    setWorkspaceName(null);
  };

  const hasEntitlement = (feature: string): boolean => {
    if (!isLoggedIn || !currentPlan) return false;
    return PLAN_ENTITLEMENTS[currentPlan].includes(feature);
  };

  return (
    <AuthContext.Provider value={{ currentPlan, isLoggedIn, userEmail, workspaceName, setPlan, logout, hasEntitlement }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
