// Quick Start: Integration Points for Workspace Feature

## 1. Update Sign-Up Flow

After user signs up, redirect to workspace creation:

```tsx
// app/sign-up/page.tsx
import { createWorkspace } from '@/lib/workspace-client';

export default async function SignUpPage() {
  return (
    <form action={async (formData) => {
      // ... create user ...
      
      // After user created, create their workspace
      const workspace = await createWorkspace({
        name: formData.get('name') + "'s Workspace",
        slug: `workspace-${Date.now()}`,
        description: 'My GeoSelect workspace'
      });
      
      redirect(`/workspace/${workspace.id}`);
    }}>
      {/* ... form fields ... */}
    </form>
  );
}
```

## 2. Create Workspace Layout Page

```tsx
// app/workspace/[id]/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { getWorkspace } from '@/lib/workspace-client';
import Navigation from '@/components/WorkspaceNav';

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const [workspace, setWorkspace] = useState(null);
  
  useEffect(() => {
    getWorkspace(params.id).then(setWorkspace);
  }, [params.id]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Navigation workspace={workspace} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

## 3. Create Dashboard Page

```tsx
// app/workspace/[id]/page.tsx
import { WorkspaceDashboard } from '@/components/WorkspaceDashboard';

export default function WorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  return <WorkspaceDashboard workspace_id={params.id} />;
}
```

## 4. Create Members Page

```tsx
// app/workspace/[id]/members/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getWorkspace } from '@/lib/workspace-client';
import { MembersManager } from '@/components/MembersManager';

export default function MembersPage({
  params,
}: {
  params: { id: string };
}) {
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(() => {
    getWorkspace(params.id).then((ws) => {
      // Check if current user is owner
      setIsOwner(!!ws); // You'll need to check actual ownership
    });
  }, [params.id]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Workspace Members</h1>
      <MembersManager workspace_id={params.id} is_owner={isOwner} />
    </div>
  );
}
```

## 5. Create Reports Page

```tsx
// app/workspace/[id]/reports/page.tsx
'use client';

import { useState } from 'react';
import { ReportsList } from '@/components/ReportsList';
import { createReport } from '@/lib/report-client';
import { Plus } from 'lucide-react';

export default function ReportsPage({
  params,
}: {
  params: { id: string };
}) {
  const [creating, setCreating] = useState(false);

  const handleNewReport = async () => {
    // Create a sample report
    const report = await createReport({
      workspace_id: params.id,
      title: 'New Activity Report',
      report_type: 'activity_summary',
      data: {
        period: 'Last 30 Days',
        total_events: 0,
      },
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <button
          onClick={handleNewReport}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          New Report
        </button>
      </div>
      <ReportsList workspace_id={params.id} />
    </div>
  );
}
```

## 6. Create Activity Page

```tsx
// app/workspace/[id]/activity/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getActivityLogs, getActivityStats } from '@/lib/activity-logger';
import { ActivityLog } from '@/lib/types/workspace';

export default function ActivityPage({
  params,
}: {
  params: { id: string };
}) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityLogs(params.id, { limit: 100 }).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [params.id]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Activity Logs</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.action_description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

## 7. Create Public Report Share Page

```tsx
// app/reports/shared/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSharedReport, downloadSharedReport } from '@/lib/report-client';
import { Report } from '@/lib/types/workspace';
import { Download, Lock } from 'lucide-react';

export default function SharedReportPage({
  params,
}: {
  params: { token: string };
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await getSharedReport(params.token, password || undefined);
        setReport(data);
        setNeedsPassword(false);
      } catch (error: any) {
        if (error.message.includes('Password')) {
          setNeedsPassword(true);
        }
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
      a.click();
    }
  };

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-6">Password Protected</h1>
          <p className="text-gray-600 text-center mb-6">
            This report is password protected. Please enter the password to access it.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                window.location.reload();
              }
            }}
          />
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Access Report
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Loading report...</div>;
  }

  if (!report) {
    return (
      <div className="text-center py-12 text-red-600">
        Report not found or has expired.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-2">{report.title}</h1>
        {report.description && (
          <p className="text-gray-600 mb-6">{report.description}</p>
        )}
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Type:</strong> {report.report_type}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Created:</strong> {new Date(report.created_at).toLocaleString()}
          </p>
        </div>

        {report.data_json && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Report Data</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(report.data_json, null, 2)}
            </pre>
          </div>
        )}

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Download className="h-4 w-4" />
          Download Report
        </button>
      </div>
    </div>
  );
}
```

## 8. Update Pricing Page

Add call-to-action to workspace in pricing page:

```tsx
// In enhanced-page.tsx, update CTA buttons
<Link
  href="/workspace/setup"
  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
    plan.featured
      ? 'bg-orange-500 text-white hover:bg-orange-600'
      : 'bg-slate-700 text-white hover:bg-slate-600'
  }`}
>
  Start Your Workspace
  <ArrowRight className="h-4 w-4" />
</Link>
```

## 9. Create Navigation Component

```tsx
// components/WorkspaceNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, FileText, Activity, Settings } from 'lucide-react';

export default function WorkspaceNav({ workspace }: any) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '', icon: BarChart3, label: 'Dashboard' },
    { href: '/activity', icon: Activity, label: 'Activity' },
    { href: '/reports', icon: FileText, label: 'Reports' },
    { href: '/members', icon: Users, label: 'Members' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">{workspace?.name}</h1>
      </div>
      
      <nav className="p-4 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname.includes(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

## 10. Important Setup Steps

1. **Run database migration**: Execute `db/migrations/001_create_workspace_schema.sql`
2. **Install recharts**: `pnpm install recharts`
3. **Configure auth**: Ensure Supabase auth is set up
4. **Set environment variables**: Update `.env.local` with your Supabase URL and key
5. **Test endpoints**: Use Postman/Insomnia to test API endpoints
6. **Configure RLS**: Verify all RLS policies are in place
7. **Add to nav**: Update your main app navigation to include workspace link

## Success Criteria

✅ Users can create workspaces after signing up
✅ Workspace members can see activity logs and reports
✅ Reports can be generated and downloaded
✅ Reports can be shared via unique links
✅ Public users can download shared reports
✅ All actions are tracked with timestamps and metadata
✅ Only workspace members can save/share reports
✅ Password protection on shared reports works
✅ Expiration dates on shares are respected
✅ Dashboard shows metrics and charts

