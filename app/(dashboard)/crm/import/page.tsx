// CSV Contact Import Page — Server component with C046 paywall + C103 component
// Route: app/(dashboard)/crm/import/page.tsx

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { C046UnlockDetails } from '@/lib/components/C046-UnlockDetails';
import { CSVContactUpload } from '@/lib/components/C103-CSVContactUpload';
import { FileUp } from 'lucide-react';

/**
 * Page: CSV Contact Import (C107)
 * Route: /dashboard/crm/import
 *
 * SERVER-SIDE:
 * - Verify user logged in
 * - Verify workspace membership
 * - Get user workspace tier from subscription
 *
 * CLIENT-SIDE (C046 UnlockDetails):
 * - Check if tier has ccp-09 entitlement
 * - If NOT: show upgrade prompt + UnlockDetails paywall
 * - If YES: show C103 CSVContactUpload component
 *
 * HARDENING:
 * - C046 gate prevents free users from accessing upload (UI-level)
 * - C103 component enforces tier-based row limits (server-side, definitive)
 * - C104 hook logs all uploads to append-only audit table
 * - C105 API route is server-authoritative (all validation happens server-side)
 */

export const metadata = {
  title: 'Import Contacts | Parcel IQ',
  description: 'Upload contacts via CSV for bulk import',
};

async function getWorkspaceTier(workspaceId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // In middleware or edge runtime
          }
        },
      },
    }
  );

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin');
  }

  // Verify workspace membership
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    redirect('/dashboard');
  }

  // Get workspace tier
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*, subscriptions(tier)')
    .eq('id', workspaceId)
    .single();

  if (workspaceError || !workspace) {
    redirect('/dashboard');
  }

  return {
    user,
    workspace,
    tier: workspace.subscriptions?.[0]?.tier || 'free',
  };
}

interface PageProps {
  params: Promise<{ workspace_id?: string }>;
}

export default async function CSVImportPage({ params }: PageProps) {
  const { workspace_id = 'default' } = await params;

  // Verify auth + get tier (server-side)
  const { user, workspace, tier } = await getWorkspaceTier(workspace_id);

  const hasCSVAccessEntitlement =
    tier !== 'free' && tier !== 'pro'; // CCP-09 available on Pro+ and above

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <FileUp className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Import Contacts</h1>
              <p className="text-sm text-gray-600 mt-1">
                Upload a CSV file to bulk import contacts into your workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            {hasCSVAccessEntitlement ? (
              <Suspense fallback={<div>Loading...</div>}>
                <CSVContactUploadSection
                  workspaceId={workspace_id}
                  onSuccess={(count) => {
                    // Trigger SWR revalidation in parent
                    console.log(`Successfully imported ${count} contacts`);
                  }}
                />
              </Suspense>
            ) : (
              <C046UnlockDetails
                feature="ccp-09:contact-upload"
                tier={tier}
                message="Contact Upload"
                description="Upgrade to import contacts from CSV files"
                onUpgradeClick={() => {
                  // Navigate to upgrade
                  window.location.href = '/pricing';
                }}
              />
            )}
          </div>

          {/* Info Sidebar */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              CSV Format
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-1">Required columns:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>email (must be valid)</li>
                  <li>name (display name)</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-1">Optional columns:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>phone</li>
                  <li>company</li>
                  <li>notes</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs font-medium text-blue-900 mb-1">
                  💡 Tip: Column order doesn't matter
                </p>
                <p className="text-xs text-blue-800">
                  Your CSV file must have headers in the first row.
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-1">Limits:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>Max file size: 10 MB</li>
                  <li>Max rows: {getLimitForTier(tier).toLocaleString()}</li>
                  <li>Valid emails only</li>
                </ul>
              </div>

              <a
                href="#sample"
                className="block mt-4 text-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Download Sample CSV →
              </a>
            </div>
          </div>
        </div>

        {/* Sample CSV Section */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 id="sample" className="text-lg font-semibold text-gray-900 mb-4">
            Sample CSV Format
          </h3>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-gray-700">{`email,name,phone,company,notes
alice@example.com,Alice Johnson,555-1111,Acme Corp,Preferred client
bob@example.com,Bob Smith,555-2222,Widgets Inc,
charlie@example.com,Charlie Brown,555-3333,Tech Solutions,VIP contact`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Client component: Handles file upload state + result display
 * Calls C105 API endpoint which is server-authoritative
 */
function CSVContactUploadSection({
  workspaceId,
  onSuccess,
}: {
  workspaceId: string;
  onSuccess: (count: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
      <CSVContactUpload
        onSuccess={(count) => {
          onSuccess(count);
          // Could also trigger confetti, toast, or navigation here
        }}
        onError={(error) => {
          console.error('Upload error:', error);
          // Show error toast to user
        }}
      />
    </div>
  );
}

function getLimitForTier(tier: string): number {
  const limits: Record<string, number> = {
    free: 100,
    pro: 1000,
    pro_plus: 5000,
    portfolio: 20000,
    enterprise: 50000,
  };
  return limits[tier] || 100;
}
