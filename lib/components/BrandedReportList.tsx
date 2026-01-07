// C046 UnlockDetails — Branded Reports List Component (CCP-06, CCP-14)
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { useAppShell } from '@/lib/hooks/useAppShell';
import type { BrandedReport } from '@/lib/types/branded-report';

/**
 * Client component: Fetch and display list of branded reports
 * Only renders if user has passed C046 gate (already has permission)
 */
export function BrandedReportList() {
  const appShell = useAppShell();
  const [reports, setReports] = useState<BrandedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appShell.workspace) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/workspaces/${appShell.workspace!.id}/branded-reports`,
          { credentials: 'include' }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch reports: ${res.statusText}`);
        }

        const data = await res.json();
        setReports(data.reports ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [appShell.workspace]);

  if (loading) {
    return <div className="text-center text-gray-500">Loading reports...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      {/* Create button */}
      <div className="mb-8">
        <Link
          href="/dashboard/branded-reports/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          <Plus className="h-5 w-5" />
          Create Report
        </Link>
      </div>

      {/* Reports grid */}
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No reports yet</h3>
          <p className="text-gray-600 mt-2">Create your first branded report to get started</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual report card
 */
interface ReportCardProps {
  report: BrandedReport;
}

function ReportCard({ report }: ReportCardProps) {
  const appShell = useAppShell();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(
        `/api/workspaces/${appShell.workspace!.id}/branded-reports/${report.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error('Failed to delete report');
      }

      // Refresh page
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting report');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{report.description || 'No description'}</p>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <span>Created {new Date(report.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/dashboard/branded-reports/${report.id}`}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 text-sm font-semibold"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
