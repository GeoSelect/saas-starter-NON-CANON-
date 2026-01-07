/**
 * Feature Gating System (C046 Gating)
 * Premium features with subscription requirements
 * 
 * Demo data showing feature availability across plan tiers
 */

export type PlanType = 'browse' | 'home' | 'studio' | 'pro-workspace' | 'pro-crm' | 'pro-ai' | 'portfolio';

export type FeatureId = 
  | 'basic-search'
  | 'advanced-search'
  | 'map-view'
  | 'saved-searches'
  | 'property-comparison'
  | 'market-analysis'
  | 'ai-insights'
  | 'crm-contacts'
  | 'crm-pipeline'
  | 'crm-automation'
  | 'data-export'
  | 'api-access'
  | 'custom-reports'
  | 'team-collaboration'
  | 'white-label'
  | 'audit-trail';

export interface Feature {
  id: FeatureId;
  name: string;
  description: string;
  category: 'search' | 'analysis' | 'crm' | 'reporting' | 'admin' | 'integration';
  minPlanRequired: PlanType;
  icon?: string;
}

export interface PlanDetails {
  id: PlanType;
  name: string;
  displayName: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'annual';
  userLimit: number;
  storageGB: number;
  apiCallsPerMonth: number;
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  featured?: boolean;
  color?: string;
}

/**
 * DEMO DATA: Feature Definitions
 * All premium features and their minimum required plan
 */
export const FEATURES: Record<FeatureId, Feature> = {
  // Search Features
  'basic-search': {
    id: 'basic-search',
    name: 'Basic Search',
    description: 'Search properties by location and basic filters',
    category: 'search',
    minPlanRequired: 'browse',
  },
  'advanced-search': {
    id: 'advanced-search',
    name: 'Advanced Search Filters',
    description: 'Complex queries with multiple criteria and saved filters',
    category: 'search',
    minPlanRequired: 'studio',
  },
  'map-view': {
    id: 'map-view',
    name: 'Map View',
    description: 'Interactive map visualization of search results',
    category: 'search',
    minPlanRequired: 'home',
  },
  'saved-searches': {
    id: 'saved-searches',
    name: 'Saved Searches',
    description: 'Save and organize your searches for quick access',
    category: 'search',
    minPlanRequired: 'home',
  },

  // Analysis Features
  'property-comparison': {
    id: 'property-comparison',
    name: 'Property Comparison',
    description: 'Compare multiple properties side-by-side',
    category: 'analysis',
    minPlanRequired: 'studio',
  },
  'market-analysis': {
    id: 'market-analysis',
    name: 'Market Analysis',
    description: 'Detailed market trends and neighborhood analytics',
    category: 'analysis',
    minPlanRequired: 'pro-workspace',
  },
  'ai-insights': {
    id: 'ai-insights',
    name: 'AI-Powered Insights',
    description: 'AI-generated investment recommendations and market predictions',
    category: 'analysis',
    minPlanRequired: 'pro-ai',
  },

  // CRM Features
  'crm-contacts': {
    id: 'crm-contacts',
    name: 'Contact Management',
    description: 'Organize and manage client and prospect contacts',
    category: 'crm',
    minPlanRequired: 'pro-crm',
  },
  'crm-pipeline': {
    id: 'crm-pipeline',
    name: 'Sales Pipeline',
    description: 'Track deals through customizable pipeline stages',
    category: 'crm',
    minPlanRequired: 'pro-crm',
  },
  'crm-automation': {
    id: 'crm-automation',
    name: 'Workflow Automation',
    description: 'Automate tasks, reminders, and follow-ups',
    category: 'crm',
    minPlanRequired: 'pro-crm',
  },

  // Reporting & Export
  'data-export': {
    id: 'data-export',
    name: 'Data Export',
    description: 'Export data to CSV, Excel, and PDF formats',
    category: 'reporting',
    minPlanRequired: 'studio',
  },
  'custom-reports': {
    id: 'custom-reports',
    name: 'Custom Reports',
    description: 'Create branded, customizable reports',
    category: 'reporting',
    minPlanRequired: 'pro-workspace',
  },
  'api-access': {
    id: 'api-access',
    name: 'API Access',
    description: 'Full API access for integrations and automation',
    category: 'integration',
    minPlanRequired: 'pro-ai',
  },

  // Admin & Collaboration
  'team-collaboration': {
    id: 'team-collaboration',
    name: 'Team Collaboration',
    description: 'Share workspaces, assign tasks, and collaborate with team members',
    category: 'admin',
    minPlanRequired: 'pro-workspace',
  },
  'white-label': {
    id: 'white-label',
    name: 'White Label',
    description: 'Customize branding and domain for client-facing tools',
    category: 'admin',
    minPlanRequired: 'portfolio',
  },
  'audit-trail': {
    id: 'audit-trail',
    name: 'Audit Trail',
    description: 'View complete activity logs and user actions',
    category: 'admin',
    minPlanRequired: 'pro-workspace',
  },
};

/**
 * DEMO DATA: Subscription Plans
 * Pricing tiers and their included features
 */
export const PLANS: Record<PlanType, PlanDetails> = {
  browse: {
    id: 'browse',
    name: 'Browse',
    displayName: 'Browse',
    description: 'Get started with basic property search',
    price: 0,
    billingPeriod: 'monthly',
    userLimit: 1,
    storageGB: 1,
    apiCallsPerMonth: 0,
    supportLevel: 'community',
  },
  home: {
    id: 'home',
    name: 'Home',
    displayName: 'Home',
    description: 'Perfect for homebuyers and sellers',
    price: 29,
    billingPeriod: 'monthly',
    userLimit: 2,
    storageGB: 10,
    apiCallsPerMonth: 1000,
    supportLevel: 'email',
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    displayName: 'Studio',
    description: 'For individual real estate professionals',
    price: 79,
    billingPeriod: 'monthly',
    userLimit: 1,
    storageGB: 50,
    apiCallsPerMonth: 10000,
    supportLevel: 'email',
  },
  'pro-workspace': {
    id: 'pro-workspace',
    name: 'Pro + Workspace',
    displayName: 'Pro + Workspace',
    description: 'Team collaboration and advanced analytics',
    price: 199,
    billingPeriod: 'monthly',
    userLimit: 10,
    storageGB: 500,
    apiCallsPerMonth: 100000,
    supportLevel: 'priority',
    featured: true,
    color: 'indigo',
  },
  'pro-crm': {
    id: 'pro-crm',
    name: 'Pro + CRM',
    displayName: 'Pro + CRM',
    description: 'Full CRM suite for managing deals and clients',
    price: 249,
    billingPeriod: 'monthly',
    userLimit: 10,
    storageGB: 500,
    apiCallsPerMonth: 100000,
    supportLevel: 'priority',
    color: 'orange',
  },
  'pro-ai': {
    id: 'pro-ai',
    name: 'Pro + AI',
    displayName: 'Pro + AI',
    description: 'AI-powered insights and API access',
    price: 349,
    billingPeriod: 'monthly',
    userLimit: 10,
    storageGB: 500,
    apiCallsPerMonth: 500000,
    supportLevel: 'priority',
    color: 'pink',
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio',
    displayName: 'Portfolio',
    description: 'Enterprise solution with white-label and dedicated support',
    price: 999,
    billingPeriod: 'monthly',
    userLimit: 100,
    storageGB: 5000,
    apiCallsPerMonth: 1000000,
    supportLevel: 'dedicated',
    color: 'green',
  },
};

/**
 * DEMO DATA: Feature Matrix
 * Shows which features are available at each plan level
 */
export const FEATURE_MATRIX: Record<PlanType, FeatureId[]> = {
  browse: [
    'basic-search',
  ],
  home: [
    'basic-search',
    'map-view',
    'saved-searches',
  ],
  studio: [
    'basic-search',
    'map-view',
    'saved-searches',
    'advanced-search',
    'property-comparison',
    'data-export',
  ],
  'pro-workspace': [
    'basic-search',
    'map-view',
    'saved-searches',
    'advanced-search',
    'property-comparison',
    'data-export',
    'market-analysis',
    'custom-reports',
    'team-collaboration',
    'audit-trail',
  ],
  'pro-crm': [
    'basic-search',
    'map-view',
    'saved-searches',
    'advanced-search',
    'property-comparison',
    'data-export',
    'market-analysis',
    'custom-reports',
    'crm-contacts',
    'crm-pipeline',
    'crm-automation',
  ],
  'pro-ai': [
    'basic-search',
    'map-view',
    'saved-searches',
    'advanced-search',
    'property-comparison',
    'data-export',
    'market-analysis',
    'custom-reports',
    'crm-contacts',
    'crm-pipeline',
    'crm-automation',
    'ai-insights',
    'api-access',
  ],
  portfolio: [
    'basic-search',
    'map-view',
    'saved-searches',
    'advanced-search',
    'property-comparison',
    'data-export',
    'market-analysis',
    'custom-reports',
    'crm-contacts',
    'crm-pipeline',
    'crm-automation',
    'ai-insights',
    'api-access',
    'team-collaboration',
    'white-label',
    'audit-trail',
  ],
};

/**
 * Get all features available for a specific plan
 */
export function getFeaturesForPlan(plan: PlanType): Feature[] {
  return (FEATURE_MATRIX[plan] || []).map(featureId => FEATURES[featureId]);
}

/**
 * Check if a feature is included in a plan
 */
export function hasFeature(plan: PlanType, featureId: FeatureId): boolean {
  return FEATURE_MATRIX[plan]?.includes(featureId) ?? false;
}

/**
 * Get the minimum plan required for a feature
 */
export function getMinPlanForFeature(featureId: FeatureId): PlanType {
  return FEATURES[featureId]?.minPlanRequired ?? 'browse';
}

/**
 * Get the plan details
 */
export function getPlanDetails(plan: PlanType): PlanDetails {
  return PLANS[plan];
}

/**
 * Get all plans sorted by price
 */
export function getAllPlans(): PlanDetails[] {
  return Object.values(PLANS).sort((a, b) => a.price - b.price);
}

/**
 * Get features that are NOT available in current plan
 */
export function getUpgradeFeatures(currentPlan: PlanType): Feature[] {
  const currentFeatures = new Set(FEATURE_MATRIX[currentPlan] || []);
  return Object.values(FEATURES).filter(f => !currentFeatures.has(f.id));
}
