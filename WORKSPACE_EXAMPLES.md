// WORKSPACE FEATURE: Complete Usage Examples

## Example 1: User Signs Up and Creates Workspace

```typescript
// app/sign-up/complete/page.tsx
'use client';

import { useState } from 'react';
import { createWorkspace } from '@/lib/workspace-client';
import { useRouter } from 'next/navigation';

export default function CreateWorkspaceAfterSignUp() {
  const [loading, setLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const workspace = await createWorkspace({
        name: workspaceName,
        slug: workspaceName.toLowerCase().replace(/\s+/g, '-'),
        description: 'My GeoSelect workspace',
      });

      if (workspace) {
        // Log that workspace was created
        await fetch('/api/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspace.id,
            action_type: 'workspace_created',
            action_description: `Created workspace: ${workspace.name}`,
          }),
        });

        router.push(`/workspace/${workspace.id}`);
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Create Your Workspace</h1>
        <p className="text-gray-600 mb-6">
          Set up your first workspace to start tracking activity and managing reports.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g., Sales Team"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !workspaceName}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## Example 2: Workspace Owner Invites Team Members

```typescript
// app/workspace/[id]/members/page.tsx
'use client';

import { useState } from 'react';
import { inviteUserToWorkspace, logActivity } from '@/lib/workspace-client';
import { MembersManager } from '@/components/MembersManager';

export default function MembersPage({ params }: { params: { id: string } }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setMessage('');

    try {
      const member = await inviteUserToWorkspace(params.id, inviteEmail, role);

      if (member) {
        setMessage(`Successfully invited ${inviteEmail} as ${role}`);
        setInviteEmail('');

        // Log the invitation
        await fetch('/api/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: params.id,
            action_type: 'user_invited',
            action_description: `Invited ${inviteEmail} with role: ${role}`,
            metadata: { invited_email: inviteEmail, role },
          }),
        });
      }
    } catch (error) {
      setMessage('Failed to invite user');
      console.error(error);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Team Members</h1>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('Success')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      <MembersManager workspace_id={params.id} is_owner={true} />
    </div>
  );
}
```

## Example 3: Generate Activity Report

```typescript
// lib/report-generator.ts
import { getActivityLogs, getActivityStats } from '@/lib/activity-logger';
import { createReport } from '@/lib/report-client';
import { ActivityLog } from '@/lib/types/workspace';

export async function generateActivityReport(
  workspace_id: string,
  days: number = 30
) {
  // Get activity logs
  const logs = await getActivityLogs(workspace_id, { limit: 1000 });

  // Get statistics
  const stats = await getActivityStats(workspace_id, days);

  // Count by action type
  const actionCounts: Record<string, number> = {};
  logs.forEach(log => {
    actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
  });

  // Count by user
  const userCounts: Record<string, number> = {};
  logs.forEach(log => {
    if (log.user_id) {
      userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
    }
  });

  // Create report
  const report = await createReport({
    workspace_id,
    title: `Activity Report - Last ${days} Days`,
    description: `Auto-generated activity summary for the last ${days} days`,
    report_type: 'activity_summary',
    data: {
      period: `${days} days`,
      generated_at: new Date().toISOString(),
      total_events: stats.total_events,
      by_action_type: actionCounts,
      by_user: userCounts,
      top_actions: Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count })),
      daily_activity: stats.by_day,
    },
  });

  return report;
}
```

Usage:
```typescript
// app/workspace/[id]/reports/generate/page.tsx
'use client';

import { useState } from 'react';
import { generateActivityReport } from '@/lib/report-generator';

export default function GenerateReportPage({ params }: { params: { id: string } }) {
  const [days, setDays] = useState(30);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const report = await generateActivityReport(params.id, days);
      alert(`Report generated: ${report?.title}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-4">Generate Activity Report</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Period (days)
          </label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            min="1"
            max="365"
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
}
```

## Example 4: Share Report Publicly

```typescript
// app/workspace/[id]/reports/[reportId]/share/page.tsx
'use client';

import { useState } from 'react';
import { shareReport, getReport } from '@/lib/report-client';
import { Copy, Check } from 'lucide-react';

export default function ShareReportPage({
  params,
}: {
  params: { id: string; reportId: string };
}) {
  const [shareUrl, setShareUrl] = useState('');
  const [password, setPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [maxDownloads, setMaxDownloads] = useState(100);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setSharing(true);

    try {
      const shared = await shareReport(params.reportId, {
        password: password || undefined,
        expires_in_days: expiryDays,
        max_downloads: maxDownloads,
      });

      if (shared) {
        setShareUrl(shared.share_url);

        // Log the share action
        await fetch('/api/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: params.id,
            action_type: 'report_shared',
            action_description: 'Shared report publicly',
            metadata: {
              report_id: params.reportId,
              has_password: !!password,
              expires_in_days: expiryDays,
            },
          }),
        });
      }
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
      <h1 className="text-3xl font-bold mb-6">Share Report</h1>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password Protection (Optional)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank for no password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Recipients must enter this password to access the report
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expires In (days)
          </label>
          <input
            type="number"
            value={expiryDays}
            onChange={(e) => setExpiryDays(parseInt(e.target.value))}
            min="1"
            max="365"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Downloads
          </label>
          <input
            type="number"
            value={maxDownloads}
            onChange={(e) => setMaxDownloads(parseInt(e.target.value))}
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-full px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold"
        >
          {sharing ? 'Creating Link...' : 'Create Share Link'}
        </button>
      </div>

      {shareUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-4">Share Link Created!</h2>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-green-300 rounded-lg bg-white text-sm font-mono"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 text-sm text-green-800">
            <p>✓ Link will expire in {expiryDays} days</p>
            {password && <p>✓ Password protected</p>}
            <p>✓ Limited to {maxDownloads} downloads</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Example 5: Public User Downloads Report

```typescript
// app/reports/shared/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSharedReport, downloadSharedReport } from '@/lib/report-client';
import { Report } from '@/lib/types/workspace';
import { Download, Lock } from 'lucide-react';

export default function SharedReportViewerPage({
  params,
}: {
  params: { token: string };
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await getSharedReport(params.token, password || undefined);
        setReport(data);
        setError('');
        setShowPasswordForm(false);
      } catch (err: any) {
        if (err.message.includes('Password')) {
          setShowPasswordForm(true);
          setError('This report requires a password.');
        } else {
          setError(err.message || 'Failed to load report');
        }
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [params.token, password]);

  const handleDownload = async () => {
    const blob = await downloadSharedReport(
      params.token,
      'pdf',
      password || undefined
    );

    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report?.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {loading && (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            Loading report...
          </div>
        )}

        {!loading && showPasswordForm && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md mx-auto">
            <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Password Protected Report</h1>
            <p className="text-gray-600 mb-6">
              This report is password protected. Please enter the password to view it.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              onKeyPress={(e) => e.key === 'Enter' && setPassword(password)}
            />
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          </div>
        )}

        {!loading && report && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h1 className="text-4xl font-bold mb-2">{report.title}</h1>
            {report.description && (
              <p className="text-gray-600 mb-6 text-lg">{report.description}</p>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Type:</strong> {report.report_type.replace(/_/g, ' ')}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Created:</strong> {new Date(report.created_at).toLocaleString()}
              </p>
            </div>

            {report.data_json && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Report Content</h2>
                <div className="bg-gray-50 p-6 rounded-lg overflow-auto max-h-96">
                  <pre className="text-sm">
                    {JSON.stringify(report.data_json, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-lg font-semibold"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </button>
          </div>
        )}

        {!loading && error && !report && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto">
            <p className="text-red-800 text-lg">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

These examples show the complete workflow from workspace creation through report sharing and public download!
