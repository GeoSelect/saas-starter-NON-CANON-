'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/lib/context/AuthContext';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Clock, MapPin, User, Shield, LogIn, LogOut, UserPlus, TrendingUp, Briefcase, Users, Settings, Plus } from 'lucide-react';

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
  timestamp: string;
}

function AuditPageContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { workspaces, activeWorkspace, activeWorkspaceId } = useWorkspaces();
  
  // Modal states
  const [showEditWorkspace, setShowEditWorkspace] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showTeamMembers, setShowTeamMembers] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  async function fetchAuditLogs() {
    try {
      setLoading(true);
      const response = await fetch('/api/audit/log?limit=100');
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      } else {
        setError('Failed to load audit logs');
      }
    } catch (err) {
      setError('Error fetching audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Console</h1>
          <p className="text-gray-600">Manage your workspaces, team, and review account activity</p>
        </div>

        {/* Account Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Active Workspace Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-6 border border-orange-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-orange-600" />
                  Active Workspace
                </h2>
                <p className="text-sm text-gray-600 mt-1">Currently viewing workspace data for:</p>
              </div>
            </div>
            <div className="bg-white rounded p-4 border border-orange-200">
              <h3 className="text-xl font-bold text-gray-900">{activeWorkspace?.name || 'Default Workspace'}</h3>
              <p className="text-sm text-gray-600 mt-1">{activeWorkspace?.description || 'No description'}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                  {activeWorkspace?.plan || 'Free'}
                </span>
                <span className="text-xs text-gray-500">ID: {activeWorkspaceId?.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 uppercase">Total Workspaces</p>
                <p className="text-2xl font-bold text-gray-900">{workspaces.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
              </div>
              <button className="w-full mt-4 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                New Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Workspaces List Section */}
        {workspaces.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-orange-600" />
              Your Workspaces
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws) => (
                <div 
                  key={ws.id} 
                  className={`p-4 rounded-lg border-2 transition ${
                    activeWorkspaceId === ws.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{ws.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{ws.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded">
                      {ws.plan || 'Free'}
                    </span>
                    {activeWorkspaceId === ws.id && (
                      <span className="text-xs font-bold text-orange-600">ACTIVE</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Workspace Settings */}
        {activeWorkspace && (
          <div className="mb-12 bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Workspace Settings
              </h2>
              <button
                onClick={() => setShowEditWorkspace(!showEditWorkspace)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
              >
                {showEditWorkspace ? 'Cancel' : 'Edit Workspace'}
              </button>
            </div>

            {showEditWorkspace ? (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Name</label>
                  <input
                    type="text"
                    defaultValue={activeWorkspace.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Workspace name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    defaultValue={activeWorkspace.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Workspace description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Plan</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Free</option>
                    <option>Pro</option>
                    <option>Enterprise</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditWorkspace(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 uppercase">Workspace Name</p>
                  <p className="text-lg font-semibold text-gray-900">{activeWorkspace.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase">Description</p>
                  <p className="text-gray-700">{activeWorkspace.description || 'No description set'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase">Plan</p>
                  <p className="text-gray-900 font-medium">{activeWorkspace.plan || 'Free'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Members Section */}
        <div className="mb-12 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Team Members
            </h2>
            <button
              onClick={() => setShowTeamMembers(!showTeamMembers)}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition"
            >
              {showTeamMembers ? 'Close' : 'Manage Team'}
            </button>
          </div>

          {showTeamMembers ? (
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Invite Team Member</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="member@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option>Member</option>
                    <option>Admin</option>
                    <option>Viewer</option>
                  </select>
                  <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Current Members</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                        Y
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">You</p>
                        <p className="text-xs text-gray-600">you@example.com</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">Owner</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                        J
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">John Colleague</p>
                        <p className="text-xs text-gray-600">john@example.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">Admin</span>
                      <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">Click "Manage Team" to add or manage team members</p>
            </div>
          )}
        </div>

        {/* Account Settings Section */}
        <div className="mb-12 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Account Settings
            </h2>
            <button
              onClick={() => setShowAccountSettings(!showAccountSettings)}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition"
            >
              {showAccountSettings ? 'Close' : 'Edit Settings'}
            </button>
          </div>

          {showAccountSettings ? (
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  defaultValue="Your Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="your@email.com"
                />
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Security</h3>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 w-full mb-2">
                  Change Password
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 w-full mb-2">
                  Enable Two-Factor Authentication
                </button>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">Email me about account activity</span>
                </label>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">Email me about workspace updates</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={() => setShowAccountSettings(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 uppercase">Display Name</p>
                <p className="text-lg font-semibold text-gray-900">Your Name</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase">Email</p>
                <p className="text-gray-700">you@example.com</p>
              </div>
              <div className="pt-4">
                <p className="text-xs text-gray-600 uppercase mb-2">Security Status</p>
                <p className="text-sm text-green-600 font-medium">✓ Password protected</p>
                <p className="text-sm text-gray-600">Two-factor authentication not enabled</p>
              </div>
            </div>
          )}
        </div>

        {/* Activity Audit Trail Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Activity Log
          </h2>
          <p className="text-gray-600 mb-6">All account actions and login attempts</p>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{logs.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful Logins</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {logs.filter(l => l.action === 'login' && l.status === 'success').length}
                </p>
              </div>
              <LogIn className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Attempts</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {logs.filter(l => l.status === 'failure').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600 opacity-20" />
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="inline-block">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
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
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadgeColor(log.plan)}`}>
                          {log.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {log.action.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500 font-mono">{log.ip_address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Showing last {logs.length} events • Auto-refreshes every 5 minutes</p>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}

export default function AuditPage() {
  return (
    <AuthProvider>
      <AuditPageContent />
    </AuthProvider>
  );
}
