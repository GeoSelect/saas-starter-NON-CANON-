'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, MapPin, Calendar, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { logger } from '@/lib/observability/logger';

interface Report {
  id: string;
  title: string;
  description?: string | null;
  address: string;
  apn?: string | null;
  createdAt: string;
  status: string;
  tags?: string[] | null;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        logger.debug('reports_load_start', {});
        const response = await fetch('/api/reports');
        if (!response.ok) {
          throw new Error(`Failed to fetch reports: ${response.statusText}`);
        }
        const data = await response.json();
        const reportList = Array.isArray(data.reports) ? data.reports : [];
        setReports(reportList);
        logger.info('reports_load_success', { count: reportList.length });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('reports_load_failed', error, {
          operation: 'load-reports-list',
        });
        setError(error.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.apn && report.apn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary operation="reports-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
            <p className="mt-2 text-gray-600">Saved parcel snapshots and intelligence</p>
          </div>
          <Link href="/preview/components">
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Create Report
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card className="p-4">
          <Input
            placeholder="Search by title, address, or APN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </Card>

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : filteredReports.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No reports match your search' : 'No reports yet'}
            </p>
            <Link href="/preview/components">
              <Button variant="outline">Create Your First Report</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>

                    {report.description && (
                      <p className="mt-1 text-sm text-gray-600">{report.description}</p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {report.address}
                      </div>
                      {report.apn && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">APN:</span>
                          {report.apn}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {report.tags && report.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {report.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    <Link href={`/dashboard/reports/${report.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  Status: <span className="font-medium">{report.status}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}
