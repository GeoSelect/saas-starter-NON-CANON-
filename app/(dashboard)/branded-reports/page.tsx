// C046 UnlockDetails Integration — Branded Reports List Page (CCP-06, CCP-14)
import { Suspense } from 'react';
import { UnlockDetails } from '@/lib/components/C046-UnlockDetails';
import { BrandedReportList } from '@/lib/components/BrandedReportList';

/**
 * `/dashboard/branded-reports`
 * Lists all branded reports in the workspace.
 * Gated by C046 UnlockDetails if user tier is insufficient.
 */
export const metadata = {
  title: 'Branded Reports',
  description: 'Create and manage custom branded reports',
};

export default async function BrandedReportsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Branded Reports</h1>
        <p className="text-gray-600 mt-2">
          Create custom reports with your branding and distribute them to clients
        </p>
      </div>

      {/* C046: Paywall gate for premium feature */}
      <UnlockDetails feature="ccp-06:branded-reports">
        <Suspense fallback={<LoadingPlaceholder />}>
          <BrandedReportList />
        </Suspense>
      </UnlockDetails>
    </main>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="bg-gray-100 rounded-lg p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-300 rounded w-1/4"></div>
        <div className="h-20 bg-gray-300 rounded"></div>
        <div className="h-20 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}
