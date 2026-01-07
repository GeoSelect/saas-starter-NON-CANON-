'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Workspace, WorkspaceStats, ActivityLog } from '@/lib/types/workspace';
import { getWorkspace, getWorkspaceStats } from '@/lib/workspace-client';
import { getActivityLogs } from '@/lib/activity-logger';
import {
  Activity,
  Users,
  FileText,
  Share2,
  TrendingUp,
  Clock,
  Download,
} from 'lucide-react';

interface WorkspaceDashboardProps {
  workspace_id: string;
}

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffa07a', '#98d8c8'];

export function WorkspaceDashboard({ workspace_id }: WorkspaceDashboardProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load workspace info
        const workspaceData = await getWorkspace(workspace_id);
        setWorkspace(workspaceData);

        // Load stats
        const statsData = await getWorkspaceStats(workspace_id);
        setStats(statsData);

        // Load recent activity
        const activityData = await getActivityLogs(workspace_id, {
          limit: 20,
        });
        setRecentActivity(activityData);

        // Process activity data for chart
        const activityByType: Record<string, number> = {};
        activityData.forEach(log => {
          activityByType[log.action_type] =
            (activityByType[log.action_type] || 0) + 1;
        });

        const chartData = Object.entries(activityByType).map(([type, count]) => ({
          name: type.replace(/_/g, ' '),
          value: count,
        }));
        setActivityData(chartData);

        setError(null);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [workspace_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
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
      {/* Header */}
      {workspace && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-gray-600 mt-2">{workspace.description}</p>
          )}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon={<Users className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="Total Activity"
            value={stats.total_activity_logs}
            icon={<Activity className="h-6 w-6" />}
            color="green"
          />
          <StatCard
            title="Reports"
            value={stats.total_reports}
            icon={<FileText className="h-6 w-6" />}
            color="purple"
          />
          <StatCard
            title="Shared Reports"
            value={stats.shared_reports_count}
            icon={<Share2 className="h-6 w-6" />}
            color="orange"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity by Type Chart */}
        {activityData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 8).map(log => (
                <ActivityItem key={log.id} log={log} />
              ))
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Activity Logs
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentActivity.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">{log.action_description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  log: ActivityLog;
}

function ActivityItem({ log }: ActivityItemProps) {
  const actionIcons: Record<string, React.ReactNode> = {
    login: <Clock className="h-4 w-4" />,
    data_accessed: <TrendingUp className="h-4 w-4" />,
    report_created: <FileText className="h-4 w-4" />,
    report_shared: <Share2 className="h-4 w-4" />,
    report_downloaded: <Download className="h-4 w-4" />,
  };

  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
      <div className="mt-1 text-gray-400">
        {actionIcons[log.action_type] || <Activity className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {log.action_type.replace(/_/g, ' ')}
        </p>
        <p className="text-sm text-gray-600 truncate">{log.action_description}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(log.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
