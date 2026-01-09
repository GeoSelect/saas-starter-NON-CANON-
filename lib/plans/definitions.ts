/**
 * Plan Definitions
 * Centralized configuration for subscription plans, pricing, and entitlements
 * Aligned with the 3-tier system: Home, Studio, Portfolio
 */

import type { SubscriptionTier } from '@/lib/contracts/ccp05/entitlements';

export interface PlanDefinition {
  id: string;
  name: string;
  displayName: string;
  tier: SubscriptionTier;
  price: number;
  billingPeriod: 'monthly' | 'annual';
  stripePriceId?: string;
  description: string;
  features: string[];
  ccps: string[]; // CCP features included
  entitlements: {
    can_resolve_parcels: boolean;
    can_generate_reports: boolean;
    can_view_reports: boolean;
    can_brand_reports: boolean;
    can_save_parcels: boolean;
    can_upload_contacts: boolean;
    can_share_collaboration: boolean; // CCP-10 collaboration features
    can_manage_events: boolean;
    can_share_basic: boolean;
    can_export_data: boolean;
  };
  limits: {
    userLimit: number;
    storageGB: number;
    reportsPerMonth: number;
  };
}

/**
 * Plan Definitions (3-tier system)
 */
export const PLAN_DEFINITIONS: Record<string, PlanDefinition> = {
  home: {
    id: 'home',
    name: 'Home',
    displayName: 'Home Plan',
    tier: 'free',
    price: 29,
    billingPeriod: 'monthly',
    stripePriceId: process.env.STRIPE_PRICE_HOME,
    description: 'Perfect for homebuyers and individual users',
    features: [
      'Parcel discovery and search',
      'Basic report generation',
      'Report viewing',
      'Basic sharing (CCP-12)',
      'Up to 10 reports per month',
    ],
    ccps: [
      'ccp-01', // parcel discovery
      'ccp-02', // parcel context
      'ccp-03', // report generation
      'ccp-04', // report viewing
      'ccp-12', // basic sharing
    ],
    entitlements: {
      can_resolve_parcels: true,
      can_generate_reports: true,
      can_view_reports: true,
      can_brand_reports: false,
      can_save_parcels: false,
      can_upload_contacts: false,
      can_share_collaboration: false,
      can_manage_events: false,
      can_share_basic: true,
      can_export_data: false,
    },
    limits: {
      userLimit: 2,
      storageGB: 10,
      reportsPerMonth: 10,
    },
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    displayName: 'Studio Plan',
    tier: 'pro',
    price: 79,
    billingPeriod: 'monthly',
    stripePriceId: process.env.STRIPE_PRICE_STUDIO,
    description: 'For real estate professionals and small teams',
    features: [
      'All Home features',
      'Branded reports (CCP-06)',
      'Saved parcels (CCP-08)',
      'Up to 50 reports per month',
      'Advanced search filters',
    ],
    ccps: [
      'ccp-01',
      'ccp-02',
      'ccp-03',
      'ccp-04',
      'ccp-06', // branded reports
      'ccp-08', // saved parcels
      'ccp-12',
    ],
    entitlements: {
      can_resolve_parcels: true,
      can_generate_reports: true,
      can_view_reports: true,
      can_brand_reports: true,
      can_save_parcels: true,
      can_upload_contacts: false,
      can_share_collaboration: false,
      can_manage_events: false,
      can_share_basic: true,
      can_export_data: false,
    },
    limits: {
      userLimit: 5,
      storageGB: 50,
      reportsPerMonth: 50,
    },
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio',
    displayName: 'Portfolio Plan',
    tier: 'portfolio',
    price: 199,
    billingPeriod: 'monthly',
    stripePriceId: process.env.STRIPE_PRICE_PORTFOLIO,
    description: 'Enterprise solution with advanced collaboration',
    features: [
      'All Studio features',
      'Contact upload (CCP-09)',
      'Advanced collaboration (CCP-10)',
      'Role-based share links (viewer/commenter/editor)',
      'Time-limited links',
      'Recipient tracking',
      'Audit trails (CCP-15)',
      'Event management (CCP-11)',
      'Data export',
      'Unlimited reports',
    ],
    ccps: [
      'ccp-01',
      'ccp-02',
      'ccp-03',
      'ccp-04',
      'ccp-06',
      'ccp-07', // audit logging
      'ccp-08',
      'ccp-09', // contact upload
      'ccp-10', // collaboration/share links
      'ccp-11', // events
      'ccp-12',
      'ccp-15', // export
    ],
    entitlements: {
      can_resolve_parcels: true,
      can_generate_reports: true,
      can_view_reports: true,
      can_brand_reports: true,
      can_save_parcels: true,
      can_upload_contacts: true,
      can_share_collaboration: true, // CCP-10 enabled
      can_manage_events: true,
      can_share_basic: true,
      can_export_data: true,
    },
    limits: {
      userLimit: 25,
      storageGB: 500,
      reportsPerMonth: -1, // unlimited
    },
  },
};

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): PlanDefinition | undefined {
  return PLAN_DEFINITIONS[planId];
}

/**
 * Get plan by tier
 */
export function getPlanByTier(tier: SubscriptionTier): PlanDefinition | undefined {
  return Object.values(PLAN_DEFINITIONS).find((plan) => plan.tier === tier);
}

/**
 * Check if a plan has a specific entitlement
 */
export function planHasEntitlement(
  planId: string,
  entitlement: keyof PlanDefinition['entitlements']
): boolean {
  const plan = getPlanById(planId);
  return plan?.entitlements[entitlement] ?? false;
}

/**
 * Get all plans sorted by price
 */
export function getAllPlans(): PlanDefinition[] {
  return Object.values(PLAN_DEFINITIONS).sort((a, b) => a.price - b.price);
}

/**
 * Get minimum plan required for an entitlement
 */
export function getMinimumPlanForEntitlement(
  entitlement: keyof PlanDefinition['entitlements']
): PlanDefinition | undefined {
  const plans = getAllPlans();
  return plans.find((plan) => plan.entitlements[entitlement]);
}
