'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { href: '/dashboard/settings/profile', label: 'Profile', id: 'profile' },
    { href: '/dashboard/settings/security', label: 'Security', id: 'security' },
    { href: '/dashboard/settings/team', label: 'Team', id: 'team' },
    { href: '/dashboard/settings/billing', label: 'Billing', id: 'billing' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <nav className="space-y-1 md:col-span-1">
          {tabs.map((tab) => {
            const isActive = pathname.endsWith(tab.id);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="md:col-span-3">
          <Card className="p-6">
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
}
