// C046 UnlockDetails — Branded Report Editor Component (CCP-06, CCP-14)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppShell } from '@/lib/hooks/useAppShell';
import type { BrandedReport } from '@/lib/types/branded-report';

interface BrandedReportEditorProps {
  reportId: string;
}

/**
 * Client component: Edit a branded report
 * Fetches report by ID and displays editor UI
 */
export function BrandedReportEditor({ reportId }: BrandedReportEditorProps) {
  const router = useRouter();
  const appShell = useAppShell();
  const [report, setReport] = useState<BrandedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!appShell.workspace) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/workspaces/${appShell.workspace!.id}/branded-reports/${reportId}`,
          { credentials: 'include' }
        );

        if (res.status === 404) {
          router.push('/dashboard/branded-reports');
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch report: ${res.statusText}`);
        }

        const data = await res.json();
        setReport(data.report);
        setFormData({
          name: data.report.name,
          description: data.report.description || '',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [appShell.workspace, reportId, router]);

  const handleSave = async () => {
    if (!appShell.workspace || !report) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(
        `/api/workspaces/${appShell.workspace.id}/branded-reports/${reportId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save report');
      }

      const data = await res.json();
      setReport(data.report);
      alert('Report saved successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading report...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (!report) {
    return <div className="text-center text-gray-500">Report not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Report</h2>

        <div className="space-y-6">
          {/* Name field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Q4 2025 Performance Report"
            />
          </div>

          {/* Description field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add optional details about this report"
            />
          </div>

          {/* Branding section (placeholder) */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding</h3>
            <p className="text-sm text-gray-600">
              Customize your report branding (logo, colors, fonts) — Coming soon
            </p>
          </div>

          {/* Preview section (placeholder) */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="bg-gray-100 rounded p-8 text-center text-gray-500">
              Report preview — Coming soon
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-6 flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => router.push('/dashboard/branded-reports')}
              className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
