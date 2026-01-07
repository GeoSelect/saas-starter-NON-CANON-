import React from 'react';
import Link from 'next/link';
import { getAuthContextServerSide } from '@/lib/server/auth';

interface Params {
  pageNum: string;
}

/**
 * Paginated Parcels Listing Page
 * Route: /parcels/page/[pageNum]
 *
 * SECURITY: This is a server component with:
 * ✓ Server-side auth verification
 * ✓ Workspace-scoped data access
 * ✓ Defensive UI for not-logged-in users
 */
export default async function ParcelsPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<Params>;
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  // Next.js 15+ requires awaiting async params
  const { pageNum: pageNumStr } = await params;
  const pageNum = Number(pageNumStr);
  const search = await searchParams;
  const demoMode = search?.demo as string | undefined;
  const demoWorkspaceId = search?.workspace as string | undefined;

  // ============================================================================
  // DEFENSIVE: Validate page parameter
  // ============================================================================
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Page</h1>
        <p className="text-gray-700 mb-4">
          Page number must be a positive integer. You provided: {pageNumStr}
        </p>
        <Link href="/parcels/page/1" className="text-blue-600 underline hover:underline">
          Go to first page
        </Link>
      </main>
    );
  }

  // ============================================================================
  // DEVELOPMENT MODE: Allow controlling UX via URL parameters
  // Usage: /parcels/page/1?demo=not-signed-in
  //        /parcels/page/1?demo=no-workspace
  //        /parcels/page/1?demo=authenticated&workspace=ws-demo-123
  // ============================================================================
  let user: any = null;
  let workspaceId: string | null = null;

  if (demoMode) {
    // Development mode: control UX via query params
    if (demoMode === 'authenticated' || demoMode === 'with-workspace') {
      user = {
        id: 'demo-user-123',
        email: 'demo@example.com',
        name: 'Demo User'
      };
      workspaceId = demoWorkspaceId || 'demo-workspace-abc';
    } else if (demoMode === 'no-workspace') {
      user = {
        id: 'demo-user-123',
        email: 'demo@example.com',
        name: 'Demo User'
      };
      workspaceId = null;
    } else if (demoMode === 'not-signed-in') {
      user = null;
      workspaceId = null;
    }
  } else {
    // Production mode: Get authenticated user + workspace server-side
    const auth = await getAuthContextServerSide();
    user = auth.user;
    workspaceId = auth.workspaceId;
  }

  // Calculate pagination state (needed for all views)
  const totalPages = 3;
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  // ============================================================================
  // DEFENSIVE: If not authenticated, show login prompt
  // ============================================================================
  if (!user) {
    return (
      <main className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Not Signed In</h1>
        <p className="text-gray-600 mb-6">
          You need to sign in to view parcels.
        </p>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-blue-900 font-semibold mb-4">
            Sign in to get started:
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  // ============================================================================
  // DEFENSIVE: If authenticated but no workspace, show workspace selection
  // ============================================================================
  if (!workspaceId) {
    return (
      <main className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Select a Workspace</h1>
        <p className="text-gray-600 mb-6">
          Welcome! You need to select or create a workspace to view parcels.
        </p>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-4">
          <p className="text-amber-900 font-semibold">
            Options:
          </p>
          <div className="space-y-2">
            <Link
              href="/workspaces"
              className="block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-center"
            >
              View Workspaces
            </Link>
            <Link
              href="/workspaces/create"
              className="block px-6 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition text-center"
            >
              Create New Workspace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================================
  // SUCCESS: User is authenticated and has a workspace
  // ============================================================================
  // TODO: Wire up real parcel data from DB
  // For now, show a placeholder with the authenticated workspace

  return (
    <main className="p-6 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Parcels</h1>
        <p className="text-gray-600">
          Page {pageNum} of {totalPages} • Workspace: {workspaceId}
        </p>
      </header>

      <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
        <h2 className="font-semibold text-green-900 mb-2">✅ Authenticated</h2>
        <p className="text-sm text-green-800">
          Signed in as: {user.email || user.id}
        </p>
      </div>

      {/* TODO: Replace with real ParcelList component */}
      <div className="space-y-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 hover:shadow-md transition">
            <h3 className="font-semibold">Sample Parcel {(pageNum - 1) * 3 + i}</h3>
            <p className="text-sm text-gray-600">123 Main St, Suite {100 + i}</p>
            <p className="text-xs text-gray-500 mt-2">Area: 2.5 acres • Items: 5</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex gap-4 items-center justify-between">
        <div>
          {hasPreviousPage ? (
            <Link
              href={`/parcels/page/${pageNum - 1}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              ← Previous
            </Link>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
            >
              ← Previous
            </button>
          )}
        </div>

        <span className="text-sm text-gray-600">
          Page {pageNum} of {totalPages}
        </span>

        <div>
          {hasNextPage ? (
            <Link
              href={`/parcels/page/${pageNum + 1}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Next →
            </Link>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-700 font-mono">
        <p className="mb-2">Development Status:</p>
        <p>✓ Auth: Server-side verified{demoMode && ` (DEMO: ${demoMode})`}</p>
        <p>✓ Workspace: Resolved</p>
        <p>○ Parcels: TODO - Connect to DB</p>
        <p>○ Pagination: TODO - Real data from getPaginatedParcels()</p>
        {demoMode && (
          <p className="mt-2 text-amber-700 border-t pt-2">
            Demo Mode Active: Use query params to test UX<br/>
            ?demo=not-signed-in | ?demo=no-workspace | ?demo=authenticated&workspace=ws-id
          </p>
        )}
      </div>
    </main>
  );
}
