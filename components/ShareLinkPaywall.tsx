import React from 'react';
import { Lock, Check } from 'lucide-react';
import Link from 'next/link';

interface ShareLinkPaywallProps {
  /**
   * Custom title for the paywall
   */
  title?: string;
  
  /**
   * Custom message explaining why upgrade is needed
   */
  message?: string;
  
  /**
   * Show as a full-page modal or inline component
   */
  variant?: 'modal' | 'inline';
  
  /**
   * Callback when user clicks upgrade button
   */
  onUpgrade?: () => void;
}

/**
 * ShareLinkPaywall Component
 * 
 * Displays a paywall for CCP-10 advanced collaboration features
 * Shows locked state with upgrade CTA for Portfolio plan
 */
export function ShareLinkPaywall({
  title = 'Upgrade to Portfolio Plan',
  message = 'Advanced collaboration features require the Portfolio plan',
  variant = 'inline',
  onUpgrade,
}: ShareLinkPaywallProps) {
  const portfolioBenefits = [
    'Role-based share links (viewer, commenter, editor)',
    'Time-limited links with custom expiration',
    'Recipient tracking and analytics',
    'Complete audit trails for compliance',
    'Unlimited share links',
    'Advanced security controls',
  ];

  const containerClass = variant === 'modal' 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
    : 'w-full';

  const contentClass = variant === 'modal'
    ? 'bg-white rounded-lg shadow-xl max-w-md w-full p-6'
    : 'bg-white border border-gray-200 rounded-lg p-6';

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header with lock icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">Portfolio Plan Required</p>
          </div>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-6">{message}</p>

        {/* Benefits list */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            What's included in Portfolio:
          </h4>
          <ul className="space-y-2">
            {portfolioBenefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-900">$199</span>
              <span className="text-gray-600 ml-1">/month</span>
            </div>
            <span className="text-sm text-green-600 font-medium">
              Save 20% annually
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <Link
            href="/pricing"
            onClick={onUpgrade}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
          >
            Upgrade Now
          </Link>
          <Link
            href="/pricing"
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors text-center"
          >
            Compare Plans
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Questions? <Link href="/contact" className="text-amber-600 hover:underline">Contact sales</Link>
        </p>
      </div>
    </div>
  );
}

export default ShareLinkPaywall;
