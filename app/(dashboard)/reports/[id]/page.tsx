'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context/AppContext';
import { MapPin, Calendar, ArrowLeft, Download, Share2 } from 'lucide-react';
import { getReportById } from '../actions';
import type { Report } from '@/lib/db/schema';
import type { ParcelResult } from '@/components/parcel/ParcelDetailsSheet';

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { user, team } = useApp();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      const result = await getReportById(params.id);
      if (result.data) {
        setReport(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    loadReport();
  }, [params.id]);

  if (!user || !team) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (loading) {
    return <div className="text-center py-12">Loading report...</div>;
  }

  if (error || !report) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Report not found'}</p>
          <Link href="/dashboard/reports">
            <Button variant="outline">Back to Reports</Button>
          </Link>
        </div>
      </div>
    );
  }

  const parcelData = report.parcelSnapshot as unknown as ParcelResult;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/reports" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{report.title}</h1>
            {report.description && (
              <p className="mt-2 text-gray-600">{report.description}</p>
            )}
          </div>

          <div className="ml-4 flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-1">Created</p>
          <p className="text-sm font-semibold">{new Date(report.createdAt).toLocaleDateString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-1">Status</p>
          <Badge variant={report.status === 'draft' ? 'outline' : 'default'}>
            {report.status}
          </Badge>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-1">Parcel</p>
          <p className="text-sm font-semibold">{report.apn || 'N/A'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-1">Jurisdiction</p>
          <p className="text-sm font-semibold">{report.jurisdiction || 'N/A'}</p>
        </Card>
      </div>

      {/* Parcel Info */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Parcel Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-600 mb-2">Address</p>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              {report.address}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-2">APN</p>
            <p className="text-sm font-medium text-gray-900">{report.apn || 'N/A'}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-2">Jurisdiction</p>
            <p className="text-sm font-medium text-gray-900">{report.jurisdiction || 'N/A'}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-2">Zoning</p>
            <p className="text-sm font-medium text-gray-900">{report.zoning || 'N/A'}</p>
          </div>
        </div>

        {parcelData?.lat && parcelData?.lng && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-600 mb-2">Coordinates</p>
            <p className="text-sm font-medium text-gray-900">
              {parcelData.lat}, {parcelData.lng}
            </p>
          </div>
        )}
      </Card>

      {/* Sources */}
      {parcelData?.sources && parcelData.sources.length > 0 && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h2>
          <div className="space-y-2">
            {parcelData.sources.map((source: string) => (
              <div key={source} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                {source}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      {parcelData?.notes && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <p className="text-gray-700">{parcelData.notes}</p>
        </Card>
      )}

      {/* Findings */}
      {report.findings && Object.keys(report.findings).length > 0 && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Findings</h2>
          <div className="space-y-3">
            {Object.entries(report.findings).map(([key, value]) => (
              <div key={key} className="border-b pb-3 last:border-b-0">
                <p className="text-sm font-medium text-gray-900 capitalize">{key}</p>
                <p className="text-sm text-gray-700">{String(value)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tags */}
      {report.tags && (report.tags as string[]).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {(report.tags as string[]).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
