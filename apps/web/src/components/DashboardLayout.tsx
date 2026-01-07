import { Header } from './Header';

/**
 * DashboardLayout - Root layout for all authenticated/dashboard routes
 * 
 * Usage: Wrap your dashboard pages with this component or create a layout.tsx that uses it
 * 
 * Example in app/(dashboard)/layout.tsx:
 * 
 *   import { DashboardLayout } from '@/components/DashboardLayout';
 *   
 *   export default function Layout({ children }: { children: React.ReactNode }) {
 *     return <DashboardLayout>{children}</DashboardLayout>;
 *   }
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header with navigation and workspace switcher */}
      <Header />

      {/* Main content area */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Optional: Footer */}
      {/* <Footer /> */}
    </div>
  );
}
