'use client';

import { useEffect, useState } from 'react';
import {
  getWorkspaceReports,
  deleteReport,
  shareReport,
  downloadReport,
} from '@/lib/report-client';
import { Report } from '@/lib/types/workspace';
import {
  Download,
  Share2,
  Trash2,
  Eye,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface ReportsListProps {
  workspace_id: string;
}

export function ReportsList({ workspace_id }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [workspace_id]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceReports(workspace_id);
      setReports(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (report_id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const success = await deleteReport(report_id);
      if (success) {
        setReports(reports.filter(r => r.id !== report_id));
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const handleShare = async (report_id: string) => {
    try {
      const shared = await shareReport(report_id, {
        expires_in_days: 30,
      });
      if (shared) {
        setShareLink(shared.share_url);
        setSelectedReport(report_id);
      }
    } catch (err) {
      console.error('Error sharing report:', err);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const blob = await downloadReport(report, 'pdf');
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title}.pdf`;
        a.click();
      }
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert('Share link copied to clipboard!');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {shareLink && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Report Shared!</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-3 py-2 border border-green-300 rounded bg-white text-sm"
            />
            <button
              onClick={copyShareLink}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No reports yet. Create your first report!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.title}
                    </h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {report.report_type}
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Created on {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDownload(report)}
                    title="Download"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleShare(report.id)}
                    title="Share"
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    title="Delete"
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
