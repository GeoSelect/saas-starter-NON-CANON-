// C046 UnlockDetails Integration — Branded Report Detail Page (CCP-06, CCP-14)
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { UnlockDetails } from '@/lib/components/C046-UnlockDetails';
import { BrandedReportEditor } from '@/lib/components/BrandedReportEditor';

/**
 * `/dashboard/branded-reports/[id]`
 * Edit a specific branded report.
 * Gated by C046 UnlockDetails if user tier is insufficient.
 * Returns 404 if report does not exist or user is not in workspace.
 */
export const metadata = {
  title: 'Edit Branded Report',
  description: 'Customize and publish your branded report',
};

interface BrandedReportDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BrandedReportDetailPage({
  params,
}: BrandedReportDetailPageProps) {
  const { id } = await params;

  // Validate UUID format (basic check; server will validate on fetch)
  if (!isValidUUID(id)) {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* C046: Paywall gate for premium feature */}
      <UnlockDetails feature="ccp-06:branded-reports">
        <Suspense fallback={<LoadingPlaceholder />}>
          <BrandedReportEditor reportId={id} />
        </Suspense>
      </UnlockDetails>
    </main>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="bg-gray-100 rounded-lg p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-300 rounded w-1/3"></div>
        <div className="h-96 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

/**
 * Basic UUID validation (v4 format)
 * More thorough validation happens on server
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
