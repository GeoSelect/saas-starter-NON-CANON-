'use client';

import { useState } from 'react';
import { PLANS, FEATURES, FEATURE_MATRIX } from '@/lib/features';
import { FeatureComparisonTable } from '@/components/FeaturePaywall';
import { Check, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/Footer';

export default function EnhancedPricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const plans = Object.values(PLANS).sort((a, b) => a.price - b.price);

  const supportLevelColors: Record<string, string> = {
    community: 'bg-gray-100 text-gray-700',
    email: 'bg-blue-100 text-blue-700',
    priority: 'bg-purple-100 text-purple-700',
    dedicated: 'bg-orange-100 text-orange-700',
  };

  const supportLevelLabels: Record<string, string> = {
    community: 'Community Support',
    email: 'Email Support',
    priority: 'Priority Support',
    dedicated: 'Dedicated Support',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            Choose the perfect plan for your real estate business. Upgrade or downgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  billingPeriod === 'annual'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map(plan => {
            const features = FEATURE_MATRIX[plan.id] || [];
            const annualPrice = Math.floor(plan.price * 12 * 0.8);
            const displayPrice = billingPeriod === 'annual' ? annualPrice : plan.price;

            return (
              <div
                key={plan.id}
                className={`rounded-xl border-2 overflow-hidden transition-all ${
                  plan.featured
                    ? 'border-orange-500 bg-slate-800/80 ring-2 ring-orange-500/20 scale-105'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                {/* Plan Header */}
                <div className="p-6 border-b border-slate-700">
                  {plan.featured && (
                    <div className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-2">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.displayName}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-white">
                      ${displayPrice}
                      <span className="text-lg text-gray-400">/mo</span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <p className="text-xs text-green-400 mt-2">
                        Save ${Math.floor(plan.price * 2.4)} annually
                      </p>
                    )}
                  </div>
                </div>

                {/* Plan Details */}
                <div className="p-6 space-y-4 border-b border-slate-700">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-300">
                      <span>Users</span>
                      <span className="font-semibold">{plan.userLimit}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span>Storage</span>
                      <span className="font-semibold">{plan.storageGB}GB</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span>API Calls</span>
                      <span className="font-semibold">{plan.apiCallsPerMonth.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300 pt-2 border-t border-slate-700">
                      <span>Support</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${supportLevelColors[plan.supportLevel]}`}>
                        {supportLevelLabels[plan.supportLevel]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="p-6 border-b border-slate-700">
                  <Link
                    href="/sign-up"
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-center block ${
                      plan.featured
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Features List */}
                <div className="p-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-4">Includes:</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {features.slice(0, 8).map(featureId => {
                      const feature = FEATURES[featureId];
                      return (
                        <div key={featureId} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature.name}</span>
                        </div>
                      );
                    })}
                    {features.length > 8 && (
                      <p className="text-xs text-gray-500 pt-2">
                        +{features.length - 8} more features
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Matrix Link */}
        <div className="text-center mb-12">
          <Link
            href="/feature-gating"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Complete Feature Matrix
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Comparison Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">Complete Feature Comparison</h2>
          <div className="overflow-x-auto">
            <FeatureComparisonTable />
          </div>
        </div>

        {/* FAQ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Can I change plans?</h3>
            <p className="text-gray-300">
              Yes, you can upgrade or downgrade your plan anytime. Changes take effect on your next billing cycle.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Do you offer refunds?</h3>
            <p className="text-gray-300">
              We offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your first month.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">What's included in support?</h3>
            <p className="text-gray-300">
              Community plans get community support, Email support for Home/Studio, Priority for Pro plans, and Dedicated account managers for Portfolio.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Need a custom plan?</h3>
            <p className="text-gray-300">
              Enterprise customers can contact our sales team for custom pricing, features, and support options tailored to your needs.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
