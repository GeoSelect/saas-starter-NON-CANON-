'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, ArrowRight } from 'lucide-react';

interface AuditLog {
  id: string;
  user_name: string;
  user_email: string;
  date: string;
  time: string;
  ip_address: string;
  status: string;
  plan: string;
}

export function RecentActivityWidget() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentLogs();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRecentLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRecentLogs() {
    try {
      const response = await fetch('/api/audit/log?limit=5');
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Link
          href="/audit"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            No recent activity
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <LogIn className={`h-4 w-4 ${log.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {log.user_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {log.user_email}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>{log.date} {log.time}</span>
                    <span>•</span>
                    <span className="font-mono">{log.ip_address}</span>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    log.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
