'use client'

import { Card } from '../../components/Card'
import Link from 'next/link'
import { ArrowRight, Palette, FileText, Settings, Tag, LogOut, Zap, Code, CheckCircle } from 'lucide-react'

export default function PreviewHubPage() {
  const demoPages = [
    {
      title: 'CCP-06: Branded Reports',
      description: 'Private label report generation with custom logos, colors, and branding. Multi-tenant demo with version control and single-active constraints.',
      path: '/preview/ccp-06-branded-reports',
      icon: FileText,
      category: 'Core CCP',
      features: [
        'Create branded reports',
        'Multi-tenant support',
        'Version control (PATCH)',
        'Single-active constraint',
        'Admin permissions'
      ]
    },
    {
      title: 'Workspace Audit Logs',
      description: 'Immutable audit trail for workspace events. Track team member changes, entitlements, plan upgrades, billing syncs, and configuration changes with full RLS enforcement.',
      path: '/workspace-audit-logs',
      icon: LogOut,
      category: 'Core CCP',
      features: [
        'Immutable append-only logs',
        'RLS enforcement',
        'Event filtering & search',
        'Demo data seeding',
        'Audit summary view'
      ]
    },
    {
      title: 'Account Settings',
      description: 'User account management page displaying profile information and subscription details.',
      path: '/account',
      icon: Settings,
      category: 'Portal',
      features: [
        'Profile management',
        'Subscription info',
        'Account details',
        'Edit capabilities'
      ]
    },
    {
      title: 'Plan Selection',
      description: 'Choose plan page for subscription management and tier selection.',
      path: '/choose-plan',
      icon: Tag,
      category: 'Portal',
      features: [
        'Plan comparison',
        'Price display',
        'Feature breakdown',
        'Selection flow'
      ]
    },
    {
      title: 'Pricing Page',
      description: 'Main pricing page showcasing available plans and features.',
      path: '/pricing',
      icon: Palette,
      category: 'Portal',
      features: [
        'Plan overview',
        'Feature highlights',
        'Call-to-action buttons',
        'Responsive design'
      ]
    }
  ]

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/audit/seed-demo',
      description: 'Check if workspace has demo data',
      params: '?workspaceId=<id>',
      status: '✅ Tested'
    },
    {
      method: 'POST',
      path: '/api/audit/seed-demo',
      description: 'Seed demo audit entries for first-time users',
      body: '{ workspaceId: string }',
      status: '✅ Tested'
    },
    {
      method: 'POST',
      path: '/api/workspaces/[id]/branded-reports',
      description: 'Create branded report',
      body: '{ name, description, logo_url, ... }',
      status: '✅ Tested'
    },
    {
      method: 'GET',
      path: '/api/workspaces/[id]/branded-reports',
      description: 'List workspace branded reports',
      status: '✅ Tested'
    },
    {
      method: 'GET',
      path: '/api/workspaces/[id]/branded-reports/[reportId]',
      description: 'Fetch specific branded report',
      status: '✅ Tested'
    },
    {
      method: 'PATCH',
      path: '/api/workspaces/[id]/branded-reports/[reportId]',
      description: 'Update report (increments version)',
      status: '✅ Tested'
    },
    {
      method: 'DELETE',
      path: '/api/workspaces/[id]/branded-reports/[reportId]',
      description: 'Delete branded report',
      status: '✅ Tested'
    },
    {
      method: 'POST',
      path: '/api/workspaces/[id]/branded-reports/[reportId]/activate',
      description: 'Activate branded report',
      status: '✅ Tested'
    }
  ]

  const liveRoutes = [
    { path: '/preview', label: 'Demo Hub', status: '✅ Live' },
    { path: '/workspace-audit-logs', label: 'Audit Logs Dashboard', status: '✅ Live' },
    { path: '/pricing', label: 'Pricing Page', status: '✅ Live' },
    { path: '/account', label: 'Account Settings', status: '⏳ Stubbed' },
    { path: '/choose-plan', label: 'Plan Selection', status: '⏳ Stubbed' },
    { path: '/preview/ccp-06-branded-reports', label: 'CCP-06 Demo', status: '✅ Live' }
  ]

  const categories = Array.from(new Set(demoPages.map(p => p.category)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Demo Hub</h1>
          <p className="text-lg text-gray-600">Browse all pages and features</p>
        </div>

        {/* By Category */}
        {categories.map(category => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="inline-block w-1 h-6 bg-blue-500 mr-3 rounded"></span>
              {category}
            </h2>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {demoPages
                .filter(page => page.category === category)
                .map(page => {
                  const IconComponent = page.icon
                  return (
                    <Link key={page.path} href={page.path}>
                      <Card
                        title={page.title}
                        description={page.description}
                        className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-300 h-full"
                        footer={
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{page.features.length} features</span>
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                          </div>
                        }
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
                            <IconComponent className="w-6 h-6 text-blue-500" />
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Features:</h4>
                            <ul className="space-y-1">
                              {page.features.slice(0, 3).map(feature => (
                                <li key={feature} className="text-sm text-gray-600 flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {feature}
                                </li>
                              ))}
                              {page.features.length > 3 && (
                                <li className="text-sm text-gray-500 italic">
                                  +{page.features.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="pt-2">
                            <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {page.path}
                            </code>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )
                })}
            </div>
          </div>
        ))}

        {/* Quick Reference */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {demoPages.map(page => (
              <Link
                key={page.path}
                href={page.path}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center group"
              >
                <span className="group-hover:translate-x-1 transition-transform">
                  {page.title.split(':')[0]}
                </span>
                <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        {/* Live Routes */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <span className="inline-block w-1 h-6 bg-green-500 mr-3 rounded"></span>
            Live Routes & Pages
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {liveRoutes.map(route => (
              <Link key={route.path} href={route.path}>
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all hover:border-green-300 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <code className="text-sm font-mono text-gray-700">{route.path}</code>
                        <p className="text-xs text-gray-500 mt-1">{route.label}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded">
                      {route.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <span className="inline-block w-1 h-6 bg-purple-500 mr-3 rounded"></span>
            Tested API Endpoints
          </h2>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Method</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Endpoint</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {apiEndpoints.map((api, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                        api.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                        api.method === 'POST' ? 'bg-green-100 text-green-700' :
                        api.method === 'PATCH' ? 'bg-yellow-100 text-yellow-700' :
                        api.method === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                      }`}>
                        {api.method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        {api.path}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>
                        <p>{api.description}</p>
                        {api.body && <p className="text-xs text-gray-500 mt-1">Body: {api.body}</p>}
                        {api.params && <p className="text-xs text-gray-500 mt-1">Query: {api.params}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{api.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dev Notes */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📝 Developer Notes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All pages use the Card component (app/components/Card.tsx) as the standard skeleton</li>
            <li>• Layout standard: 2-column grid with responsive fallback (grid-cols-1 lg:grid-cols-2)</li>
            <li>• Color palette and typography defined in /branding directory</li>
            <li>• CCP-06 endpoints: 6 routes in app/api/workspaces/[id]/branded-reports/</li>
            <li>• Auth: Both Supabase cookies and Bearer JWT tokens supported</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
