'use client';

import { useContext } from 'react';
import { AuthContext, PLAN_NAMES } from '@/lib/context/AuthContext';
import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
}

export function Footer() {
  const authContext = useContext(AuthContext);
  const isLoggedIn = authContext?.isLoggedIn ?? false;
  const currentPlan = authContext?.currentPlan ?? null;

  // Define navigation structure based on plan level
  const getFooterLinks = (): Record<string, FooterLink[]> => {
    // Anonymous/Browse users
    if (!isLoggedIn) {
      return {
        Public: [
          { label: 'Home', href: '/' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Sign In', href: '/sign-in' },
        ],
        Resources: [
          { label: 'Explore', href: '/search' },
          { label: 'Audit Demo', href: '/audit-demo' },
          { label: 'Demo', href: '/preview/components' },
        ],
      };
    }

    // Logged-in but free/basic users
    if (currentPlan === 'basic' || !currentPlan) {
      return {
        Navigation: [
          { label: 'Home', href: '/' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Search', href: '/search' },
        ],
        Account: [
          { label: 'Chat', href: '/chat' },
          { label: 'Audit Trail', href: '/audit' },
          { label: 'Settings', href: '/settings' },
          { label: 'Sign Out', href: '/' },
        ],
      };
    }

    // Pro/Premium users
    if (['pro_crm', 'pro_ai', 'portfolio'].includes(currentPlan)) {
      return {
        Navigation: [
          { label: 'Home', href: '/' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Chat', href: '/chat' },
          { label: 'Search', href: '/search' },
        ],
        Dashboard: [
          { label: 'Details', href: '/details' },
          { label: 'Audit Trail', href: '/audit' },
          { label: 'Feature Gating', href: '/feature-gating' },
        ],
        Settings: [
          { label: 'Account Settings', href: '/settings' },
          { label: 'Billing', href: '/billing' },
          { label: 'Team', href: '/team' },
          { label: 'Sign Out', href: '/' },
        ],
      };
    }

    // Enterprise users
    if (currentPlan === 'enterprise') {
      return {
        Navigation: [
          { label: 'Home', href: '/' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Chat', href: '/chat' },
          { label: 'Search', href: '/search' },
        ],
        Dashboard: [
          { label: 'Details', href: '/details' },
          { label: 'Audit Trail', href: '/audit' },
          { label: 'Feature Gating', href: '/feature-gating' },
          { label: 'CRM', href: '/crm/import' },
        ],
        Settings: [
          { label: 'Account Settings', href: '/settings' },
          { label: 'Billing', href: '/billing' },
          { label: 'Team', href: '/team' },
          { label: 'Admin', href: '/admin' },
          { label: 'Integrations', href: '/integrations' },
          { label: 'Sign Out', href: '/' },
        ],
      };
    }

    return {};
  };

  const footerLinks = getFooterLinks();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-12 pt-8 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <ul className="space-y-2 pl-4">
                {links.map((link: FooterLink) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-white hover:text-orange-400 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-xs text-gray-500 mb-4 sm:mb-0">
            <p>&copy; 2026 GeoSelect. All rights reserved.</p>
            {isLoggedIn && currentPlan && (
              <p className="mt-1">
                Current Plan: <span className="text-gray-400">{PLAN_NAMES[currentPlan]}</span>
              </p>
            )}
          </div>
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-xs text-white hover:text-orange-400 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              href="/"
              className="text-xs text-white hover:text-orange-400 transition-colors duration-200"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
