'use client';

import WorkspaceSwitcherDropdown from './WorkspaceSwitcherDropdown';

/**
 * Header - Main application header with navigation
 * 
 * Includes:
 * - Workspace switcher dropdown
 * - User menu (add as needed)
 * - Navigation links
 */
export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>

          {/* Right side: Workspace Switcher + User Menu */}
          <div className="flex items-center gap-4">
            {/* Workspace Switcher */}
            <div className="min-w-[200px]">
              <WorkspaceSwitcherDropdown />
            </div>

            {/* TODO: Add user menu/profile dropdown here */}
            {/* 
            <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
              Profile
            </button>
            */}
          </div>
        </div>
      </div>
    </header>
  );
}
