'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { MapPin, Menu, X, ChevronDown, Home, Search, Users, Settings, LogOut, Bell, MessageSquare } from 'lucide-react';

interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  submenu?: NavigationItem[];
}

interface NavigationConfig {
  public: NavigationItem[];
  authenticated: NavigationItem[];
  dashboard: NavigationItem[];
}

const navigationConfig: NavigationConfig = {
  // Public navigation (unauthenticated users)
  public: [
    { label: 'Home', href: '/' },
    { label: 'Explore', href: '/search' },
    { label: 'Pricing', href: '/pricing' },
    {
      label: 'Resources',
      href: '#',
      submenu: [
        { label: 'Documentation', href: '#docs' },
        { label: 'Blog', href: '#blog' },
        { label: 'API Reference', href: '#api' },
        { label: 'Community', href: '#community' },
      ],
    },
  ],
  // Authenticated user navigation (signed in but not in dashboard)
  authenticated: [
    { label: 'Dashboard', href: '/chat', icon: <Home className="h-4 w-4" /> },
    { label: 'Search', href: '/search', icon: <Search className="h-4 w-4" /> },
    { label: 'Pricing', href: '/pricing', icon: <Settings className="h-4 w-4" /> },
  ],
  // Dashboard navigation (inside workspace)
  dashboard: [
    { label: 'Chat', href: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
    { label: 'Audit Trail', href: '/audit', icon: <Search className="h-4 w-4" /> },
    { label: 'Pricing', href: '/pricing', icon: <Settings className="h-4 w-4" /> },
    {
      label: 'Workspace',
      href: '#',
      icon: <Users className="h-4 w-4" />,
      submenu: [
        { label: 'Settings', href: '/settings' },
        { label: 'Team Members', href: '/team' },
        { label: 'Billing', href: '/billing' },
      ],
    },
  ],
};

interface PublicNavigationProps {
  isDashboard?: boolean;
  isAuthenticated?: boolean;
  currentUser?: {
    name: string;
    plan: string;
  };
  onLogout?: () => void;
}

export function PublicNavigation({
  isDashboard = false,
  isAuthenticated = false,
  currentUser,
  onLogout,
}: PublicNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Determine which navigation to show
  let navItems = navigationConfig.public;
  if (isDashboard) {
    navItems = navigationConfig.dashboard;
  } else if (isAuthenticated) {
    navItems = navigationConfig.authenticated;
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    onLogout?.();
    router.push('/');
  };

  const renderNavItem = (item: NavigationItem, isMobile = false) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const active = isActive(item.href);

    if (hasSubmenu) {
      return (
        <div key={item.label} className="group relative">
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              active
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
            }`}
            onClick={() => isMobile && setOpenSubmenu(openSubmenu === item.label ? null : item.label)}
          >
            {item.icon && item.icon}
            {item.label}
            <ChevronDown className={`h-4 w-4 transition ${isMobile ? '' : 'group-hover:rotate-180'}`} />
          </button>

          {/* Desktop Submenu */}
          {!isMobile && (
            <div className="absolute left-0 mt-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {item.submenu?.map(subitem => (
                <Link
                  key={subitem.label}
                  href={subitem.href}
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 first:rounded-t-lg last:rounded-b-lg transition"
                >
                  {subitem.label}
                </Link>
              ))}
            </div>
          )}

          {/* Mobile Submenu */}
          {isMobile && openSubmenu === item.label && (
            <div className="mt-2 ml-4 space-y-1 border-l border-slate-700 pl-3">
              {item.submenu?.map(subitem => (
                <Link
                  key={subitem.label}
                  href={subitem.href}
                  className="block text-sm text-gray-300 hover:text-white py-2 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {subitem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
          active
            ? 'bg-orange-500/20 text-orange-400'
            : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {item.icon && item.icon}
        {item.label}
        {item.badge && <span className="ml-1 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{item.badge}</span>}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <MapPin className="h-6 w-6 text-orange-500 group-hover:text-orange-400 transition" />
            <span className="text-lg sm:text-xl font-bold text-white group-hover:text-orange-400 transition">
              GeoSelect.It
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(item => renderNavItem(item, false))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && currentUser ? (
              <>
                <button className="p-2 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{currentUser.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{currentUser.plan}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-300 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-gray-300 hover:text-white transition font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-slate-800/50 border-t border-slate-700 py-4 px-2 space-y-2">
            {navItems.map(item => renderNavItem(item, true))}

            <div className="border-t border-slate-700 pt-4 mt-4 space-y-2">
              {isAuthenticated && currentUser ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{currentUser.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{currentUser.plan}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="block w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

/**
 * Simplified public nav for public pages
 */
export function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <MapPin className="h-6 w-6 text-orange-500" />
            <span className="text-lg sm:text-xl font-bold text-white">GeoSelect.It</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navigationConfig.public.map(item => (
              <div key={item.label} className="group relative">
                <Link
                  href={item.href}
                  className="text-gray-300 hover:text-white transition font-medium flex items-center gap-2"
                >
                  {item.label}
                  {item.submenu && <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition" />}
                </Link>

                {item.submenu && (
                  <div className="absolute left-0 mt-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {item.submenu.map(subitem => (
                      <Link
                        key={subitem.label}
                        href={subitem.href}
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 first:rounded-t-lg last:rounded-b-lg transition"
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Link href="/sign-in" className="text-gray-300 hover:text-white transition font-medium">
              Sign In
            </Link>
            <Link href="/sign-up" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-slate-800/50 border-t border-slate-700 py-4 px-4 space-y-3">
            {navigationConfig.public.map(item => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className="block text-gray-300 hover:text-white py-2 font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
                {item.submenu && (
                  <div className="ml-4 mt-2 space-y-1 border-l border-slate-700 pl-3">
                    {item.submenu.map(subitem => (
                      <Link
                        key={subitem.label}
                        href={subitem.href}
                        className="block text-sm text-gray-400 hover:text-gray-200 py-1 transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-slate-700 pt-3 space-y-2">
              <Link
                href="/sign-in"
                className="block text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="block w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition text-center font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
