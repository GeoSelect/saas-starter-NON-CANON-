import React from 'react';
import Link from 'next/link';

interface Params {
  pageNum: string;
}

/**
 * Minimal demo page for /parcels/page/[pageNum]
 * Verifies route is working before auth/DB integration.
 */
export default async function ParcelsPageDemo({ params }: { params: Params }) {
  const pageNum = Number(params.pageNum);

  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Invalid Page</h1>
        <p className="text-gray-700 mb-4">
          Page number must be a positive integer. You provided: {params.pageNum}
        </p>
        <Link href="/parcels/page/1" className="text-blue-600 underline">
          Go to first page
        </Link>
      </main>
    );
  }

  // Demo: show 3 pages total
  const totalPages = 3;
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  return (
    <main className="p-6 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Parcels</h1>
        <p className="text-gray-600">
          Page {pageNum} of {totalPages}
        </p>
      </header>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">✅ Route is working!</h2>
        <p className="text-sm text-blue-800">
          The pagination route <code className="bg-blue-100 px-1 rounded">/parcels/page/{pageNum}</code> is rendering correctly.
        </p>
      </div>

      {/* Mock parcel list */}
      <div className="space-y-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 hover:shadow-md transition">
            <h3 className="font-semibold">Sample Parcel {(pageNum - 1) * 3 + i}</h3>
            <p className="text-sm text-gray-600">123 Main St, Suite {100 + i}</p>
            <p className="text-xs text-gray-500 mt-2">
              Area: {Math.random().toFixed(2)} acres • Items: {Math.floor(Math.random() * 10)}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="flex gap-4 items-center justify-between">
        <div>
          {hasPreviousPage ? (
            <Link 
              href={`/parcels/page/${pageNum - 1}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded">
        <p className="text-sm font-mono text-amber-900">
          <strong>Next Steps:</strong><br/>
          1. Define getAuthContextServerSide() or use your auth system<br/>
          2. Wire up getPaginatedParcels() to Supabase<br/>
          3. Remove this demo and uncomment the real implementation
        </p>
      </div>
    </main>
  );
}
