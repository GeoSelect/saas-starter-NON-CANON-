'use client';

import { Home, MessageCircle, FileText, Shield, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      href: '/parcels/page/1?demo=authenticated',
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat',
      href: '/chat?demo=authenticated',
    },
    {
      id: 'details',
      icon: FileText,
      label: 'Details',
      href: '/details?demo=authenticated',
    },
    {
      id: 'audit',
      icon: Shield,
      label: 'Audit',
      href: '/audit',
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      href: '/settings',
    },
  ];

  const isActive = (href: string) => {
    const basePath = href.split('?')[0];
    return pathname.includes(basePath);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto">
        {navItems.map(({ id, icon: Icon, label, href }) => {
          const active = isActive(href);
          return (
            <button
              key={id}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center justify-center w-20 h-20 transition-colors ${
                active
                  ? 'text-orange-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={label}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
