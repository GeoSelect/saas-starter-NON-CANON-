// C046 UnlockDetails Integration — Create Branded Report Page (CCP-06, CCP-14)
import { UnlockDetails } from '@/lib/components/C046-UnlockDetails';
import { BrandedReportCreator } from '@/lib/components/BrandedReportCreator';

/**
 * `/dashboard/branded-reports/new`
 * Create a new branded report.
 * Gated by C046 UnlockDetails if user tier is insufficient.
 */
export const metadata = {
  title: 'Create Branded Report',
  description: 'Start creating a new custom branded report',
};

export default async function CreateBrandedReportPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Branded Report</h1>
        <p className="text-gray-600 mt-2">
          Build a new report with your custom branding
        </p>
      </div>

      {/* C046: Paywall gate for premium feature */}
      <UnlockDetails feature="ccp-06:branded-reports">
        <BrandedReportCreator />
      </UnlockDetails>
    </main>
  );
}
