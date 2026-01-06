'use client';

import { ArrowRight, Lock, Zap } from 'lucide-react';
import Link from 'next/link';
import { FEATURES, PLANS, PlanType, FeatureId } from '@/lib/features';

/**
 * Feature Locked Banner - Shows when feature is not available
 */
export function FeatureLockedBanner({
  featureId,
  userPlan = 'browse',
}: {
  featureId: FeatureId;
  userPlan?: PlanType;
}) {
  const feature = FEATURES[featureId];
  const minPlan = PLANS[feature.minPlanRequired];

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">
            {feature.name} Locked
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            This feature is available in the <span className="font-semibold">{minPlan.displayName}</span> plan or higher.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Upgrade Plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Upgrade Prompt - Modal/inline CTA for features
 */
export function FeatureUpgradePrompt({
  featureId,
  userPlan = 'browse',
  title,
  description,
  onUpgradeClick,
}: {
  featureId: FeatureId;
  userPlan?: PlanType;
  title?: string;
  description?: string;
  onUpgradeClick?: () => void;
}) {
  const feature = FEATURES[featureId];
  const minPlan = PLANS[feature.minPlanRequired];

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">
          {title || `Unlock ${feature.name}`}
        </h3>
      </div>
      <p className="text-blue-700 mb-4">
        {description || `Upgrade to ${minPlan.displayName} to access ${feature.name}.`}
      </p>
      <div className="bg-blue-100 rounded p-3 mb-4 text-sm text-blue-800">
        <p><strong>Included in:</strong> {minPlan.displayName}</p>
        <p className="text-xs mt-1 opacity-75">${minPlan.price}/month</p>
      </div>
      <button
        onClick={onUpgradeClick}
        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Upgrade Now
      </button>
    </div>
  );
}

/**
 * Feature Comparison Table - Shows what's included at each plan
 */
export function FeatureComparisonTable() {
  const plans = Object.values(PLANS).sort((a, b) => a.price - b.price);
  const categories = ['search', 'analysis', 'crm', 'reporting', 'admin', 'integration'] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-300">
            <th className="p-3 text-left font-semibold text-slate-700 w-48">Feature</th>
            {plans.map(plan => (
              <th key={plan.id} className="p-3 text-center font-semibold text-slate-700 min-w-24">
                <div className="text-sm">{plan.displayName}</div>
                <div className="text-xs text-slate-600">${plan.price}/mo</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={`category-${category}`} className="border-t-2 border-slate-200">
              <td colSpan={plans.length + 1} className="p-3 bg-slate-50 font-semibold text-slate-700 capitalize">
                {category}
              </td>
            </tr>
          ))}
          {Object.values(FEATURES)
            .sort((a, b) => {
              if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
              }
              return a.name.localeCompare(b.name);
            })
            .map(feature => (
              <tr key={feature.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-700">{feature.name}</td>
                {plans.map(plan => {
                  const hasFeature = plan.id !== 'browse' ? // Placeholder logic
                    feature.minPlanRequired === plan.id || 
                    feature.minPlanRequired === 'browse' || 
                    ['home', 'studio', 'pro-workspace', 'pro-crm', 'pro-ai', 'portfolio'].includes(plan.id)
                    : feature.minPlanRequired === 'browse';

                  return (
                    <td key={`${feature.id}-${plan.id}`} className="p-3 text-center">
                      {hasFeature ? (
                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Feature Badge - Shows if feature is premium/included
 */
export function FeatureBadge({
  featureId,
  userPlan = 'browse',
  compact = false,
}: {
  featureId: FeatureId;
  userPlan?: PlanType;
  compact?: boolean;
}) {
  const feature = FEATURES[featureId];
  const hasAccess = userPlan !== 'browse'; // Simplified check

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
        hasAccess 
          ? 'bg-green-100 text-green-700' 
          : 'bg-amber-100 text-amber-700'
      }`}>
        {hasAccess ? '✓' : '🔒'} {feature.name}
      </span>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${
      hasAccess
        ? 'border-green-200 bg-green-50'
        : 'border-amber-200 bg-amber-50'
    }`}>
      <div className="flex items-center gap-2">
        {hasAccess ? (
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <Lock className="w-5 h-5 text-amber-600" />
        )}
        <span className={hasAccess ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
          {feature.name}
        </span>
      </div>
    </div>
  );
}
