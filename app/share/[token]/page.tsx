'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SharedReportData {
  ok: boolean;
  error?: string;
  reason?: string;
  share_link?: {
    id: string;
    short_code: string;
    created_at: string;
    view_count: number;
  };
  snapshot?: {
    id: string;
    data: Record<string, any>;
  };
  report?: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
  };
}

export default function SharedReportPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    fetchSharedReport();
  }, [token]);

  const fetchSharedReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/share-links/${token}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to load shared report');
        setData(json);
        return;
      }

      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load shared report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading...</div>
          <div className="text-gray-500">Please wait while we load the report</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md text-center">
          <div className="text-xl font-semibold text-red-600 mb-2">
            {data?.reason === 'auth_required'
              ? 'Authentication Required'
              : 'Unable to Access Report'}
          </div>
          <div className="text-gray-600 mb-6">{error}</div>
          {data?.reason === 'auth_required' && (
            <Link href="/sign-in">
              <Button className="w-full">Sign In</Button>
            </Link>
          )}
          {data?.reason !== 'auth_required' && (
            <div className="text-sm text-gray-500">
              {data?.reason === 'expired' &&
                'This share link has expired.'}
              {data?.reason === 'revoked' &&
                'This share link has been revoked by the owner.'}
              {data?.reason === 'max_views_reached' &&
                'This share link has reached its maximum view limit.'}
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (!data?.ok || !data?.snapshot) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md text-center">
          <div className="text-xl font-semibold mb-2">Report Not Found</div>
          <div className="text-gray-500">
            The report you're looking for doesn't exist or has been deleted.
          </div>
        </Card>
      </div>
    );
  }

  const { report, snapshot, share_link } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{report?.name}</h1>
          {report?.description && (
            <p className="text-gray-600 mb-4">{report.description}</p>
          )}
          <div className="text-sm text-gray-500 space-y-1">
            <div>
              Created:{' '}
              {new Date(report?.created_at).toLocaleDateString()}
            </div>
            <div>
              Views: {share_link?.view_count}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <Card className="p-8">
          <div className="space-y-6">
            {/* Display snapshot data as key-value pairs */}
            {Object.entries(snapshot.data || {}).map(([key, value]) => (
              <div key={key} className="border-b pb-4 last:border-b-0">
                <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-gray-900">
                  {typeof value === 'object' ? (
                    <pre className="bg-gray-100 p-4 rounded overflow-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <div>{String(value)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This is a shared report from{' '}
            <span className="font-semibold">{process.env.NEXT_PUBLIC_APP_NAME || 'the app'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
