/**
 * ParcelList.tsx – Client component for rendering a list of parcels.
 *
 * Usage:
 * <ParcelList items={parcels} workspaceId={wid} />
 *
 * This is a 'use client' component because it handles:
 * - Interactive row hover/selection
 * - Links to detail pages
 * - Optional: expanded preview, quick actions
 *
 * The server component (page.tsx) passes pre-fetched items only.
 * This component does NOT fetch data or check auth.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Parcel } from '@/lib/contracts/parcel';

interface Props {
  /** Array of parcels to display (pre-fetched by server) */
  items: Parcel[];

  /** Workspace ID (used for navigation links) */
  workspaceId: string;
}

/**
 * Renders parcels as a simple table/list.
 * Each row links to the detail page.
 */
export default function ParcelList({ items, workspaceId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (items.length === 0) {
    return null; // Empty state handled by parent (page.tsx)
  }

  return (
    <div className="space-y-4">
      {items.map((parcel) => (
        <ParcelRow
          key={parcel.id}
          parcel={parcel}
          workspaceId={workspaceId}
          isExpanded={expandedId === parcel.id}
          onToggleExpand={(id) =>
            setExpandedId(expandedId === id ? null : id)
          }
        />
      ))}
    </div>
  );
}

interface ParcelRowProps {
  parcel: Parcel;
  workspaceId: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

/**
 * Single parcel row with optional expanded details.
 */
function ParcelRow({
  parcel,
  workspaceId,
  isExpanded,
  onToggleExpand,
}: ParcelRowProps) {
  const detailUrl = `/parcels/${parcel.id}`;
  const editUrl = `/parcels/${parcel.id}/edit`;

  // Format dates
  const updatedAtStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(parcel.updatedAt));

  // Status badge styling
  const statusStyles: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Row header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">
            <Link href={detailUrl} className="text-blue-600 hover:underline">
              {parcel.name}
            </Link>
          </h3>
          {parcel.address && (
            <p className="text-sm text-gray-600">{parcel.address}</p>
          )}
        </div>

        {/* Status badge */}
        <div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[parcel.status]}`}>
            {parcel.status.charAt(0).toUpperCase() + parcel.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
        <div>
          {parcel.area && <span>{parcel.area.toLocaleString()} sq ft</span>}
          {parcel.itemCount !== undefined && (
            <span className="ml-4">
              {parcel.itemCount} item{parcel.itemCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div>
          <span>Updated {updatedAtStr}</span>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
        <Link
          href={detailUrl}
          className="px-3 py-2 rounded bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 transition-colors"
        >
          View
        </Link>
        <Link
          href={editUrl}
          className="px-3 py-2 rounded bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Edit
        </Link>

        {/* Expand/collapse for details */}
        <button
          onClick={() => onToggleExpand(parcel.id)}
          className="ml-auto px-3 py-2 rounded text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? '▼ Details' : '▶ Details'}
        </button>
      </div>

      {/* Expanded details (optional) */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-gray-50 rounded space-y-2 text-sm">
          <div>
            <p className="font-semibold text-gray-700">ID</p>
            <p className="font-mono text-gray-600">{parcel.id}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Created</p>
            <p className="text-gray-600">
              {new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(parcel.createdAt))}
            </p>
          </div>
          {parcel.geometry && (
            <div>
              <p className="font-semibold text-gray-700">Geometry</p>
              <p className="text-gray-600">
                {parcel.geometry.features.length} feature
                {parcel.geometry.features.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
