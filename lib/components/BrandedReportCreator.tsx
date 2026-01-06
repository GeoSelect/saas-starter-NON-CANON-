// C046 UnlockDetails — Branded Report Creator Component (CCP-06, CCP-14)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppShell } from '@/lib/hooks/useAppShell';

/**
 * Client component: Create a new branded report
 */
export function BrandedReportCreator() {
  const router = useRouter();
  const appShell = useAppShell();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appShell.workspace) {
      setError('No workspace loaded');
      return;
    }

    if (!formData.name.trim()) {
      setError('Report name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/workspaces/${appShell.workspace.id}/branded-reports`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error('Failed to create report');
      }

      const data = await res.json();
      router.push(`/dashboard/branded-reports/${data.report.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder="e.g., Q4 2025 Performance Report"
              required
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
              disabled={loading}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Add optional details about this report"
            />
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900">
              💡 You can customize branding, add charts, and set up sharing after creating
              the report.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Creating...' : 'Create Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
