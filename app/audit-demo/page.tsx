'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Clock, Shield, LogIn, LogOut, UserPlus, TrendingUp } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan: string;
  action: string;
  date: string;
  time: string;
  ip_address: string;
  status: string;
  details?: string;
}

export default function AuditDemoPage() {
  // Mock demo data showing what users would see
  const demoLogs: AuditLog[] = [
    {
      id: '1',
      user_id: 'user_001',
      user_name: 'Sarah Chen',
      user_email: 'sarah.chen@example.com',
      plan: 'Pro + Workspace',
      action: 'login',
      date: 'Jan 6, 2026',
      time: '2:45 PM',
      ip_address: '192.168.1.45',
      status: 'success',
    },
    {
      id: '2',
      user_id: 'user_002',
      user_name: 'Marcus Johnson',
      user_email: 'marcus.j@example.com',
      plan: 'Studio',
      action: 'plan_change',
      date: 'Jan 6, 2026',
      time: '1:30 PM',
      ip_address: '203.45.67.89',
      status: 'success',
      details: 'Upgraded from Home to Studio',
    },
    {
      id: '3',
      user_id: 'user_003',
      user_name: 'Emma Rodriguez',
      user_email: 'emma.r@example.com',
      plan: 'Pro + CRM',
      action: 'login',
      date: 'Jan 6, 2026',
      time: '12:15 PM',
      ip_address: '156.78.90.12',
      status: 'success',
    },
    {
      id: '4',
      user_id: 'user_004',
      user_name: 'David Park',
      user_email: 'david.park@example.com',
      plan: 'Home',
      action: 'login',
      date: 'Jan 6, 2026',
      time: '11:00 AM',
      ip_address: '42.156.234.67',
      status: 'success',
    },
    {
      id: '5',
      user_id: 'user_005',
      user_name: 'Lisa Thompson',
      user_email: 'lisa.t@example.com',
      plan: 'Pro + AI',
      action: 'plan_change',
      date: 'Jan 5, 2026',
      time: '4:20 PM',
      ip_address: '89.234.156.78',
      status: 'success',
      details: 'Enabled AI Analytics module',
    },
    {
      id: '6',
      user_id: 'user_006',
      user_name: 'James Wilson',
      user_email: 'james.w@example.com',
      plan: 'Studio',
      action: 'login',
      date: 'Jan 5, 2026',
      time: '3:45 PM',
      ip_address: '234.67.89.10',
      status: 'success',
    },
    {
      id: '7',
      user_id: 'user_007',
      user_name: 'Maria Garcia',
      user_email: 'maria.g@example.com',
      plan: 'Browse',
      action: 'signup',
      date: 'Jan 5, 2026',
      time: '10:30 AM',
      ip_address: '167.89.234.56',
      status: 'success',
      details: 'New account created',
    },
    {
      id: '8',
      user_id: 'user_008',
      user_name: 'Robert Kim',
      user_email: 'robert.k@example.com',
      plan: 'Portfolio',
      action: 'login',
      date: 'Jan 4, 2026',
      time: '5:15 PM',
      ip_address: '78.90.123.45',
      status: 'success',
    },
    {
      id: '9',
      user_id: 'user_006',
      user_name: 'James Wilson',
      user_email: 'james.w@example.com',
      plan: 'Studio',
      action: 'logout',
      date: 'Jan 4, 2026',
      time: '2:00 PM',
      ip_address: '234.67.89.10',
      status: 'success',
    },
    {
      id: '10',
      user_id: 'user_009',
      user_name: 'Sophie Martin',
      user_email: 'sophie.m@example.com',
      plan: 'Pro + Workspace',
      action: 'login',
      date: 'Jan 4, 2026',
      time: '9:30 AM',
      ip_address: '45.123.67.89',
      status: 'success',
    },
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-gray-600" />;
      case 'signup':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'plan_change':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default:
        return <Shield className="h-4 w-4 text-purple-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'success'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getPlanBadgeColor = (plan: string) => {
    const colorMap: Record<string, string> = {
      'browse': 'bg-gray-100 text-gray-800',
      'home': 'bg-blue-100 text-blue-800',
      'studio': 'bg-purple-100 text-purple-800',
      'pro + workspace': 'bg-indigo-100 text-indigo-800',
      'pro + crm': 'bg-orange-100 text-orange-800',
      'pro + ai': 'bg-pink-100 text-pink-800',
      'portfolio': 'bg-green-100 text-green-800',
    };
    return colorMap[plan.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const actionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'login': 'Login',
      'logout': 'Logout',
      'signup': 'Sign Up',
      'plan_change': 'Plan Change',
    };
    return labels[action] || action;
  };

  const totalEvents = demoLogs.length;
  const successfulLogins = demoLogs.filter(l => l.action === 'login' && l.status === 'success').length;
  const failedAttempts = demoLogs.filter(l => l.status !== 'success').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Demo Banner */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm font-medium">
            📊 <strong>Demo Audit Trail</strong> - This shows sample data of what you'll see once logged into your account. Create an account to track your own activity.
          </p>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Audit Trail Demo</h1>
          <p className="text-gray-600">Track all user login activity and account changes across your workspace</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{totalEvents}</p>
                <p className="text-xs text-gray-500 mt-2">Last 10 days</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful Logins</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{successfulLogins}</p>
                <p className="text-xs text-gray-500 mt-2">All successful</p>
              </div>
              <LogIn className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Plan Changes</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">2</p>
                <p className="text-xs text-gray-500 mt-2">User upgrades tracked</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {demoLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{log.date}</p>
                          <p className="text-xs text-gray-500">{log.time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                          {log.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.user_name}</p>
                          <p className="text-xs text-gray-500">{log.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(log.plan)}`}>
                        {log.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm text-gray-900">{actionLabel(log.action)}</span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-xs">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(log.status)}`}>
                        {log.status === 'success' ? '✓ Success' : '✗ Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Start Tracking Your Activity
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get real-time audit logs of all user activity, plan changes, and security events in your workspace. Sign up today and get full access.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/sign-up"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition"
            >
              Create Free Account
            </a>
            <a
              href="/pricing"
              className="px-6 py-3 bg-white border border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold rounded-lg transition"
            >
              View Plans
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
