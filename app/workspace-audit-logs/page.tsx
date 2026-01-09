'use client';

/**
 * Workspace Audit Log Dashboard
 * Admin view to monitor all workspace changes, entitlements, and billing events
 * CCP-07 (Audit Logging) + CCP-05 (Entitlements)
 */

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { SeedDemoDataButton } from '@/lib/audit/use-seed-demo';

// Helper to format date as relative time (e.g., "2 hours ago")
function formatDistanceToNow(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  const months = Math.floor(diffDays / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

interface AuditEntry {
  id: string;
  workspace_id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];
  reason?: string;
  status: 'success' | 'denied' | 'failed';
  created_at: string;
}

interface WorkspaceSummary {
  workspace_id: string;
  total_events: number;
  successful_events: number;
  denied_events: number;
  failed_events: number;
  unique_actors: number;
  last_event: string;
}

const ACTION_COLORS: Record<string, string> = {
  'workspace.created': 'bg-green-100 text-green-800',
  'workspace.updated': 'bg-blue-100 text-blue-800',
  'workspace.deleted': 'bg-red-100 text-red-800',
  'workspace.member_added': 'bg-purple-100 text-purple-800',
  'workspace.member_removed': 'bg-red-100 text-red-800',
  'workspace.member_role_changed': 'bg-yellow-100 text-yellow-800',
  'workspace.plan_upgraded': 'bg-green-100 text-green-800',
  'workspace.plan_downgraded': 'bg-orange-100 text-orange-800',
  'workspace.entitlement_granted': 'bg-green-100 text-green-800',
  'workspace.entitlement_denied': 'bg-red-100 text-red-800',
  'workspace.entitlement_revoked': 'bg-red-100 text-red-800',
  'workspace.billing_sync': 'bg-blue-100 text-blue-800',
  'workspace.settings_updated': 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  failed: 'bg-gray-100 text-gray-800',
};

export default function WorkspaceAuditDashboard() {
  const supabase = supabaseBrowser();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [summary, setSummary] = useState<Record<string, WorkspaceSummary>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    workspaceId: '',
    action: '',
    status: '' as '' | 'success' | 'denied' | 'failed',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [activeTab, setActiveTab] = useState<'logs' | 'summary'>('logs');

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from('workspace_audit_log')
        .select('*')
        .gte('created_at', filter.startDate + 'T00:00:00Z')
        .lte('created_at', filter.endDate + 'T23:59:59Z')
        .order('created_at', { ascending: false });

      if (filter.workspaceId) {
        query = query.eq('workspace_id', filter.workspaceId);
      }

      if (filter.action) {
        query = query.eq('action', filter.action);
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      const { data: logsData, error: logsError } = await query.limit(200);

      if (logsError) {
        console.error('[audit-dashboard] Error loading logs:', logsError);
        return;
      }

      setLogs(logsData || []);

      // Load summary
      if (filter.workspaceId) {
        const { data: summaryData, error: summaryError } = await supabase
          .from('workspace_audit_summary')
          .select('*')
          .eq('workspace_id', filter.workspaceId)
          .single();

        if (!summaryError && summaryData) {
          setSummary({ [filter.workspaceId]: summaryData as WorkspaceSummary });
        }
      } else {
        // Load all summaries
        const { data: summaryData, error: summaryError } = await supabase
          .from('workspace_audit_summary')
          .select('*');

        if (summaryError) {
          console.error('[audit-dashboard] Error loading summary:', summaryError);
          return;
        }

        const summaryMap: Record<string, WorkspaceSummary> = {};
        summaryData?.forEach((item: any) => {
          summaryMap[item.workspace_id] = item;
        });
        setSummary(summaryMap);
      }
    } finally {
      setLoading(false);
    }
  }

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));
  const workspaceIds = Array.from(new Set(logs.map((log) => log.workspace_id)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workspace Audit Log</h1>
        <p className="text-gray-600 mt-2">Monitor all workspace changes, entitlements, and billing events</p>
      </div>

      {/* Demo Data Button */}
      {workspaceIds.length === 0 && <SeedDemoDataButton workspaceId="demo-workspace" />}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date From</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date To</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Workspace</label>
            <select
              value={filter.workspaceId}
              onChange={(e) => setFilter({ ...filter, workspaceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Workspaces</option>
              {workspaceIds.map((id) => (
                <option key={id} value={id}>
                  {id.slice(0, 8)}...
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action.replace('workspace.', '')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="denied">Denied</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 border-b-2 font-medium ${
            activeTab === 'logs'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Recent Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 border-b-2 font-medium ${
            activeTab === 'summary'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Summary ({Object.keys(summary).length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading...</div>
      ) : activeTab === 'logs' ? (
        /* Logs Tab */
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No audit logs found</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {log.action.replace('workspace.', '')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[log.status]}`}>
                        {log.status}
                      </span>
                      <span className="text-xs text-gray-500">{log.resource_type}</span>
                      <span className="text-xs text-gray-600 ml-auto">
                        {formatDistanceToNow(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Workspace:</span>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{log.workspace_id.slice(0, 8)}</code>
                  </div>
                  <div>
                    <span className="text-gray-600">Actor:</span>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{log.actor_id}</code>
                  </div>
                </div>

                {log.reason && (
                  <div className="text-sm">
                    <span className="text-gray-600">Reason:</span> <span className="text-gray-800">{log.reason}</span>
                  </div>
                )}

                {(log.old_values || log.new_values) && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Show values</summary>
                    <div className="mt-2 bg-gray-50 p-2 rounded space-y-1">
                      {log.old_values && (
                        <div>
                          <span className="font-semibold text-gray-700">Before:</span>
                          <pre className="bg-white p-1 rounded text-xs overflow-auto">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <span className="font-semibold text-gray-700">After:</span>
                          <pre className="bg-white p-1 rounded text-xs overflow-auto">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Summary Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(summary).map(([workspaceId, data]) => (
            <div key={workspaceId} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-800">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{workspaceId.slice(0, 12)}</code>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Total Events:</span>
                  <div className="text-lg font-bold text-gray-800">{data.total_events}</div>
                </div>
                <div>
                  <span className="text-gray-600">Success:</span>
                  <div className="text-lg font-bold text-green-600">{data.successful_events}</div>
                </div>
                <div>
                  <span className="text-gray-600">Denied:</span>
                  <div className="text-lg font-bold text-red-600">{data.denied_events}</div>
                </div>
                <div>
                  <span className="text-gray-600">Failed:</span>
                  <div className="text-lg font-bold text-gray-600">{data.failed_events}</div>
                </div>
              </div>
              <div className="border-t pt-2 text-xs text-gray-600">
                <div>Unique Actors: {data.unique_actors}</div>
                <div>Last Event: {formatDistanceToNow(data.last_event)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
