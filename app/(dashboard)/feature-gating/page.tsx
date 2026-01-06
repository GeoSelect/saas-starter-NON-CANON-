'use client';

import { useState } from 'react';
import { FeatureComparisonTable, FeatureLockedBanner, FeatureUpgradePrompt, FeatureBadge } from '@/components/FeaturePaywall';
import { PLANS, FEATURES } from '@/lib/features';
import { Shield, Zap, Users, TrendingUp } from 'lucide-react';

export default function FeatureGatingPage() {
  const [selectedPlan, setSelectedPlan] = useState('browse');
  const plans = Object.values(PLANS).sort((a, b) => a.price - b.price);

  const categoryIcons: Record<string, React.ReactNode> = {
    search: <Zap className="h-5 w-5" />,
    analysis: <TrendingUp className="h-5 w-5" />,
    crm: <Users className="h-5 w-5" />,
    reporting: <Shield className="h-5 w-5" />,
    admin: <Shield className="h-5 w-5" />,
    integration: <Zap className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Feature Gating Demo (C046)</h1>
          <p className="text-gray-300 text-lg">
            Premium features with subscription requirements. Explore what's available at each plan level.
          </p>
        </div>

        {/* Plan Selector */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Select Your Plan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  selectedPlan === plan.id
                    ? 'border-orange-500 bg-orange-500/20 text-white'
                    : 'border-slate-600 bg-slate-800 text-gray-300 hover:border-slate-500'
                }`}
              >
                <div className="font-semibold text-sm">{plan.displayName}</div>
                <div className="text-xs mt-1 opacity-75">${plan.price}/mo</div>
              </button>
            ))}
          </div>
        </div>

        {/* Features by Category */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            Features in {PLANS[selectedPlan as keyof typeof PLANS].displayName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['search', 'analysis', 'crm', 'reporting', 'admin', 'integration'].map(category => {
              const categoryFeatures = Object.values(FEATURES).filter(f => f.category === category);
              const availableCount = categoryFeatures.filter(f => {
                // For demo: show feature if user's plan price >= feature's min plan price
                const userPlanPrice = PLANS[selectedPlan as keyof typeof PLANS].price;
                const minPlanPrice = PLANS[f.minPlanRequired].price;
                return userPlanPrice >= minPlanPrice;
              }).length;

              return (
                <div key={category} className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    {categoryIcons[category]}
                    <h3 className="text-lg font-semibold text-white capitalize">{category}</h3>
                    <span className="ml-auto bg-slate-700 text-gray-200 text-xs px-2 py-1 rounded">
                      {availableCount}/{categoryFeatures.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {categoryFeatures.map(feature => {
                      const userPlanPrice = PLANS[selectedPlan as keyof typeof PLANS].price;
                      const minPlanPrice = PLANS[feature.minPlanRequired].price;
                      const hasAccess = userPlanPrice >= minPlanPrice;

                      return (
                        <div
                          key={feature.id}
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            hasAccess
                              ? 'bg-green-500/20 text-green-100'
                              : 'bg-red-500/20 text-red-200'
                          }`}
                        >
                          {hasAccess ? (
                            <span className="text-lg">✓</span>
                          ) : (
                            <span className="text-lg">🔒</span>
                          )}
                          <span className="flex-1">{feature.name}</span>
                          {!hasAccess && (
                            <span className="text-xs opacity-75">
                              {PLANS[feature.minPlanRequired].displayName}+
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Example Components */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Example UI Components</h2>
          <div className="space-y-6">
            {/* Feature Locked Banner Example */}
            {selectedPlan === 'browse' && (
              <div>
                <h3 className="text-white font-semibold mb-3">Feature Locked Banner</h3>
                <FeatureLockedBanner featureId="crm-contacts" userPlan={selectedPlan as any} />
              </div>
            )}

            {/* Feature Upgrade Prompt Example */}
            <div>
              <h3 className="text-white font-semibold mb-3">Feature Upgrade Prompt</h3>
              <FeatureUpgradePrompt
                featureId="ai-insights"
                userPlan={selectedPlan as any}
                title="Unlock AI-Powered Insights"
                description="Get AI-generated investment recommendations and market predictions with Pro + AI."
              />
            </div>

            {/* Feature Badges */}
            <div>
              <h3 className="text-white font-semibold mb-3">Feature Badges</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['crm-contacts', 'ai-insights', 'market-analysis'].map(featureId => (
                  <FeatureBadge
                    key={featureId}
                    featureId={featureId as any}
                    userPlan={selectedPlan as any}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Matrix Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Complete Feature Matrix</h2>
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 overflow-x-auto">
            <FeatureComparisonTable />
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 text-gray-300">
          <h3 className="text-xl font-bold text-white mb-4">Integration Documentation</h3>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Feature Gating System (C046):</strong> Complete demo data tables showing premium features 
              with subscription requirements across 7 plan tiers.
            </p>
            <p>
              <strong>Available in lib/features/:</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><code>index.ts</code> - Feature definitions and plan details</li>
              <li><code>FeatureGatingContext.tsx</code> - React context provider</li>
            </ul>
            <p>
              <strong>Hooks available in lib/hooks/:</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><code>useFeatureGating.ts</code> - Hook for checking feature access</li>
            </ul>
            <p>
              <strong>UI Components in components/:</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><code>FeaturePaywall.tsx</code> - Locked banners, upgrade prompts, badges</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
