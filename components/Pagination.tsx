/**
 * Pagination.tsx – Client component for page navigation controls.
 *
 * Usage:
 * <Pagination
 *   page={currentPage}
 *   totalPages={5}
 *   basePath="/parcels/page"
 *   hasNextPage={true}
 *   hasPreviousPage={false}
 * />
 *
 * Renders:
 * - "Previous" button (disabled on page 1)
 * - Page number display (e.g., "Page 2 of 5")
 * - "Next" button (disabled on last page)
 *
 * Uses Next.js <Link> for client-side navigation (no full reload).
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  /** Current page number (1-indexed) */
  page: number;

  /** Total number of pages */
  totalPages: number;

  /** Base URL path for page links (e.g., "/parcels/page") */
  basePath: string;

  /** Is there a next page? */
  hasNextPage: boolean;

  /** Is there a previous page? */
  hasPreviousPage: boolean;
}

/**
 * Pagination controls component.
 */
export default function Pagination({
  page,
  totalPages,
  basePath,
  hasNextPage,
  hasPreviousPage,
}: Props) {
  if (totalPages <= 1) {
    // No pagination needed if only 1 page
    return null;
  }

  const prevUrl = hasPreviousPage ? `${basePath}/${page - 1}` : null;
  const nextUrl = hasNextPage ? `${basePath}/${page + 1}` : null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8 py-6">
      {/* Previous button */}
      {hasPreviousPage ? (
        <Link
          href={prevUrl!}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          aria-label="Previous page"
        >
          ← Previous
        </Link>
      ) : (
        <button
          disabled
          className="px-4 py-2 rounded border border-gray-300 text-gray-400 font-medium cursor-not-allowed opacity-50"
          aria-label="Previous page (disabled)"
        >
          ← Previous
        </button>
      )}

      {/* Page counter */}
      <div className="flex items-center gap-2">
        <span className="text-gray-700 font-medium">
          Page {page} of {totalPages}
        </span>

        {/* Optional: Quick jump to page via input
            (Omitted for simplicity; add if needed for large page counts)
        */}
      </div>

      {/* Next button */}
      {hasNextPage ? (
        <Link
          href={nextUrl!}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          aria-label="Next page"
        >
          Next →
        </Link>
      ) : (
        <button
          disabled
          className="px-4 py-2 rounded border border-gray-300 text-gray-400 font-medium cursor-not-allowed opacity-50"
          aria-label="Next page (disabled)"
        >
          Next →
        </button>
      )}
    </div>
  );
}

/**
 * OPTIONAL: PageNumberInput for direct page jump.
 *
 * If you want to allow users to jump to a specific page number,
 * uncomment this component and add it to the Pagination controls above.
 *
 * Usage:
 * <PageNumberInput
 *   currentPage={page}
 *   totalPages={totalPages}
 *   basePath={basePath}
 * />
 */
/*
interface PageNumberInputProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

function PageNumberInput({
  currentPage,
  totalPages,
  basePath,
}: PageNumberInputProps) {
  const [input, setInput] = React.useState(String(currentPage));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = Number(input);
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > totalPages) {
      // Invalid input; reset to current page
      setInput(String(currentPage));
      return;
    }
    // Navigate to the entered page
    window.location.href = `${basePath}/${pageNum}`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label htmlFor="page-input" className="text-sm text-gray-600">
        Go to:
      </label>
      <input
        id="page-input"
        type="number"
        min={1}
        max={totalPages}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-16 px-2 py-1 border rounded text-center"
      />
      <button
        type="submit"
        className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Go
      </button>
    </form>
  );
}
*/
