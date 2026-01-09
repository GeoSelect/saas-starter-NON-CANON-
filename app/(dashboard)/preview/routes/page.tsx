'use client'

import { useState } from 'react'
import { ExternalLink, AlertCircle, AlertTriangle } from 'lucide-react'

interface CTA {
  label: string
  intent: 'primary' | 'secondary' | 'tertiary' | 'destructive'
  variant: 'button' | 'link' | 'icon'
  destination: string
}

interface RouteSpec {
  path: string
  name: string
  category: string
  purpose: string
  sections: string[]
  ctas: CTA[]
  specFile: string
}

type UXIssue = 'missing-primary' | 'too-many-ctas' | 'duplicate-wording' | 'inconsistent-intent'

interface UXFlag {
  issue: UXIssue
  severity: 'warning' | 'error'
  message: string
}

function validateRoute(route: RouteSpec): UXFlag[] {
  const flags: UXFlag[] = []

  // Check for missing primary CTA
  const hasPrimary = route.ctas.some(cta => cta.intent === 'primary')
  if (!hasPrimary && route.ctas.length > 0) {
    flags.push({
      issue: 'missing-primary',
      severity: 'error',
      message: 'Missing primary CTA - users need a clear primary action'
    })
  }

  // Check for too many CTAs
  if (route.ctas.length > 3) {
    flags.push({
      issue: 'too-many-ctas',
      severity: 'warning',
      message: `Too many CTAs (${route.ctas.length}) - limit to 3 maximum for clarity`
    })
  }

  // Check for duplicate wording
  const labels = route.ctas.map(c => c.label.toLowerCase().trim())
  const uniqueLabels = new Set(labels)
  if (uniqueLabels.size < labels.length) {
    flags.push({
      issue: 'duplicate-wording',
      severity: 'warning',
      message: 'Duplicate CTA labels - ensure unique, descriptive labels'
    })
  }

  // Check for inconsistent intent naming
  const primaryCount = route.ctas.filter(c => c.intent === 'primary').length
  if (primaryCount > 1) {
    flags.push({
      issue: 'inconsistent-intent',
      severity: 'warning',
      message: `Multiple primary CTAs (${primaryCount}) - only one should be primary`
    })
  }

  return flags
}

function getIntentColor(intent: CTA['intent']): string {
  switch (intent) {
    case 'primary':
      return 'bg-orange-600 text-white'
    case 'secondary':
      return 'bg-slate-600 text-white'
    case 'tertiary':
      return 'bg-slate-700 text-gray-300'
    case 'destructive':
      return 'bg-red-600 text-white'
  }
}

function getVariantBadge(variant: CTA['variant']): string {
  return `px-2 py-0.5 text-xs rounded bg-slate-700 text-gray-300 font-mono`
}

export default function TestRoutesPage() {
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)

  const routes: RouteSpec[] = [
    {
      path: '/',
      name: '01 - Home',
      category: 'Public',
      purpose: 'Landing page showcasing product benefits and value proposition',
      sections: ['Hero', 'Features', 'Testimonials', 'Pricing Preview', 'CTA Section'],
      ctas: [
        { label: 'Get Started', intent: 'primary', variant: 'button', destination: '/auth/signup' },
        { label: 'View Pricing', intent: 'secondary', variant: 'link', destination: '/pricing' },
        { label: 'Learn More', intent: 'tertiary', variant: 'link', destination: '#features' }
      ],
      specFile: 'app/page.tsx'
    },
    {
      path: '/chat',
      name: '02 - Chat',
      category: 'Public',
      purpose: 'Real-time messaging interface for customer support',
      sections: ['Message List', 'Input Area', 'Sidebar', 'Settings'],
      ctas: [
        { label: 'Send Message', intent: 'primary', variant: 'button', destination: '#send' },
        { label: 'Attach File', intent: 'secondary', variant: 'icon', destination: '#upload' },
        { label: 'Close Chat', intent: 'tertiary', variant: 'link', destination: '/' }
      ],
      specFile: 'app/chat/page.tsx'
    },
    {
      path: '/sign-in',
      name: '03 - Sign In',
      category: 'Auth',
      purpose: 'User authentication entry point with email/password flow',
      sections: ['Email Input', 'Password Input', 'Remember Me', 'Error States'],
      ctas: [
        { label: 'Sign In', intent: 'primary', variant: 'button', destination: '#submit' },
        { label: 'Forgot Password?', intent: 'tertiary', variant: 'link', destination: '/auth/reset' },
        { label: 'Create Account', intent: 'secondary', variant: 'link', destination: '/auth/signup' }
      ],
      specFile: 'app/auth/page.tsx'
    },
    {
      path: '/pricing',
      name: '04 - Pricing',
      category: 'Portal',
      purpose: 'Display pricing plans with feature comparison and upgrade options',
      sections: ['Plan Cards', 'Feature Comparison', 'FAQ', 'Social Proof'],
      ctas: [
        { label: 'Start Free Trial', intent: 'primary', variant: 'button', destination: '/auth/signup' },
        { label: 'Choose Plan', intent: 'primary', variant: 'button', destination: '/choose-plan' },
        { label: 'Contact Sales', intent: 'secondary', variant: 'link', destination: '/contact' },
        { label: 'View FAQ', intent: 'tertiary', variant: 'link', destination: '#faq' }
      ],
      specFile: 'app/(dashboard)/pricing/page.tsx'
    },
    {
      path: '/account',
      name: '05 - Account Settings',
      category: 'Portal',
      purpose: 'Manage user account, profile, and subscription settings',
      sections: ['Profile Info', 'Email Preferences', 'Billing', 'Security', 'Data Management'],
      ctas: [
        { label: 'Save Changes', intent: 'primary', variant: 'button', destination: '#save' },
        { label: 'Change Password', intent: 'secondary', variant: 'link', destination: '/account/password' },
        { label: 'Download Data', intent: 'tertiary', variant: 'link', destination: '#download' },
        { label: 'Delete Account', intent: 'destructive', variant: 'button', destination: '#delete-modal' }
      ],
      specFile: 'app/account/page.tsx'
    },
    {
      path: '/parcel/resolve',
      name: '06 - Parcel Lookup',
      category: 'Features',
      purpose: 'Search and resolve parcel information by address or parcel ID',
      sections: ['Search Bar', 'Results List', 'Filters', 'Detail View'],
      ctas: [
        { label: 'Search', intent: 'primary', variant: 'button', destination: '#search' },
        { label: 'View Details', intent: 'secondary', variant: 'link', destination: '#result' },
        { label: 'Advanced Search', intent: 'tertiary', variant: 'link', destination: '/search/advanced' }
      ],
      specFile: 'app/parcel/resolve/page.tsx'
    },
    {
      path: '/parcel/summary',
      name: '07 - Parcel Summary',
      category: 'Features',
      purpose: 'Comprehensive parcel information and property details',
      sections: ['Property Header', 'Parcel Map', 'Details Grid', 'History', 'Related Properties'],
      ctas: [
        { label: 'Generate Report', intent: 'primary', variant: 'button', destination: '/reports/new' },
        { label: 'Share', intent: 'secondary', variant: 'icon', destination: '#share' },
        { label: 'View Comparables', intent: 'secondary', variant: 'link', destination: '#comparables' }
      ],
      specFile: 'app/parcel/summary/page.tsx'
    },
    {
      path: '/parcel/hoa-packet',
      name: '08 - HOA Packet',
      category: 'Features',
      purpose: 'HOA document package selection and checkout',
      sections: ['Package Options', 'Price Summary', 'Details', 'Payment Method'],
      ctas: [
        { label: 'Purchase Package', intent: 'primary', variant: 'button', destination: '/checkout' },
        { label: 'Learn More', intent: 'secondary', variant: 'link', destination: '#details' },
        { label: 'Cancel', intent: 'tertiary', variant: 'link', destination: '/parcel/summary' }
      ],
      specFile: 'app/parcel/hoa-packet/page.tsx'
    },
    {
      path: '/choose-plan',
      name: '09 - Plan Selection',
      category: 'Portal',
      purpose: 'Select and confirm subscription plan during onboarding',
      sections: ['Plan Grid', 'Price Breakdown', 'Feature Details', 'Confirmation'],
      ctas: [
        { label: 'Confirm Selection', intent: 'primary', variant: 'button', destination: '/checkout' },
        { label: 'View Details', intent: 'secondary', variant: 'link', destination: '/pricing' },
        { label: 'Back', intent: 'tertiary', variant: 'link', destination: '/pricing' }
      ],
      specFile: 'app/choose-plan/page.tsx'
    },
    {
      path: '/dashboard/tools/address-lookup',
      name: '10 - Address Lookup',
      category: 'Tools',
      purpose: 'Bulk address validation and standardization tool',
      sections: ['Upload Area', 'Processing Status', 'Results Table', 'Export Options'],
      ctas: [
        { label: 'Upload CSV', intent: 'primary', variant: 'button', destination: '#upload' },
        { label: 'Download Results', intent: 'primary', variant: 'button', destination: '#download' },
        { label: 'View Sample', intent: 'secondary', variant: 'link', destination: '#sample' }
      ],
      specFile: 'app/dashboard/tools/address-lookup/page.tsx'
    },
    {
      path: '/dashboard/crm/import',
      name: '11 - CSV Import',
      category: 'CRM',
      purpose: 'Import CRM data from CSV files with mapping configuration',
      sections: ['File Upload', 'Column Mapping', 'Preview', 'Import Settings'],
      ctas: [
        { label: 'Import Data', intent: 'primary', variant: 'button', destination: '#import' },
        { label: 'Download Template', intent: 'secondary', variant: 'link', destination: '#template' },
        { label: 'Cancel', intent: 'tertiary', variant: 'link', destination: '/dashboard' }
      ],
      specFile: 'app/dashboard/crm/import/page.tsx'
    },
    {
      path: '/dashboard/branded-reports',
      name: '12 - Branded Reports',
      category: 'CCP',
      purpose: 'List and manage branded report templates and generated reports',
      sections: ['Template List', 'Filters', 'Report List', 'Quick Actions'],
      ctas: [
        { label: 'Create Report', intent: 'primary', variant: 'button', destination: '/reports/new' },
        { label: 'View Template', intent: 'secondary', variant: 'link', destination: '#template' },
        { label: 'Edit Settings', intent: 'tertiary', variant: 'icon', destination: '#settings' }
      ],
      specFile: 'app/dashboard/branded-reports/page.tsx'
    },
    {
      path: '/auth/phone-otp',
      name: '13 - Phone OTP',
      category: 'Auth',
      purpose: 'Two-step phone number verification for account signup and security',
      sections: ['Phone Input', 'OTP Verification', 'Timer', 'Error States'],
      ctas: [
        { label: 'Verify Phone', intent: 'primary', variant: 'button', destination: '#submit' },
        { label: 'Resend Code', intent: 'secondary', variant: 'link', destination: '#resend' },
        { label: 'Back', intent: 'tertiary', variant: 'link', destination: '/sign-in' }
      ],
      specFile: 'app/auth/phone-otp/page.tsx'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">UX Audit Dashboard</h1>
              <p className="text-gray-400">Route testing hub with CTA specs and UX validation</p>
            </div>
            <div className="text-sm text-right">
              <div className="text-gray-300">{routes.length} routes</div>
              <div className="text-orange-400 font-medium">
                {routes.filter(r => validateRoute(r).filter(f => f.severity === 'error').length > 0).length} with errors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {routes.map((route) => {
            const flags = validateRoute(route)
            const errors = flags.filter(f => f.severity === 'error')
            const warnings = flags.filter(f => f.severity === 'warning')
            const isExpanded = expandedRoute === route.path

            return (
              <div
                key={route.path}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-orange-500/30 transition-colors"
              >
                {/* Route Header - Click to expand */}
                <button
                  onClick={() => setExpandedRoute(isExpanded ? null : route.path)}
                  className="w-full px-6 py-4 text-left hover:bg-slate-700/30 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-white">{route.name}</h2>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded font-medium">
                        {route.category}
                      </span>
                      {errors.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-300 rounded text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.length} error(s)</span>
                        </div>
                      )}
                      {warnings.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{warnings.length} warning(s)</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{route.purpose}</p>
                    <code className="text-xs bg-slate-900 text-orange-300 px-2 py-1 rounded font-mono">
                      {route.path}
                    </code>
                  </div>
                  <div className="text-right text-gray-500 flex flex-col items-end">
                    <div className="text-sm text-gray-400 mb-2">{route.ctas.length} CTAs</div>
                    <div className="text-xl font-light">{isExpanded ? '−' : '+'}</div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-700 bg-slate-800/50">
                    <div className="px-6 py-4 space-y-6">
                      {/* Sections */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-orange-500 rounded"></div>
                          Page Sections
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {route.sections.map((section) => (
                            <div
                              key={section}
                              className="px-3 py-1.5 bg-slate-700/60 text-gray-300 text-sm rounded border border-slate-600 hover:border-orange-500/30 transition-colors"
                            >
                              {section}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTAs Specification */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-orange-500 rounded"></div>
                          CTAs Specification
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-slate-700">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-900/50 border-b border-slate-700">
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Label</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Intent</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Variant</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Destination</th>
                              </tr>
                            </thead>
                            <tbody>
                              {route.ctas.map((cta, idx) => (
                                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                                  <td className="px-4 py-3 text-white font-medium">{cta.label}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-3 py-1 text-xs rounded font-medium inline-block ${getIntentColor(cta.intent)}`}>
                                      {cta.intent}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={getVariantBadge(cta.variant)}>{cta.variant}</span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cta.destination}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* UX Issues */}
                      {flags.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            UX Issues Detected
                          </h3>
                          <div className="space-y-2">
                            {flags.map((flag, idx) => (
                              <div
                                key={idx}
                                className={`px-4 py-3 rounded-lg border ${
                                  flag.severity === 'error'
                                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {flag.severity === 'error' ? (
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  )}
                                  <span className="text-sm">{flag.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <a
                          href={route.path.startsWith('/') ? route.path : `/${route.path}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Route
                        </a>
                        <button
                          onClick={() => {
                            const specPath = `C:\\Users\\user\\Desktop\\GitHub2026\\geoselect-Telluride-hybrid\\saas-starter\\${route.specFile.replace(/\//g, '\\')}`
                            window.open(`vscode://file/${specPath}`, '_blank')
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded text-sm font-medium transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Edit Spec
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-12 p-6 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">CTA Intent Reference</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-block px-3 py-1 bg-orange-600 text-white text-xs rounded font-medium whitespace-nowrap">Primary</span>
              <span className="text-gray-400 text-sm">Main user action</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block px-3 py-1 bg-slate-600 text-white text-xs rounded font-medium whitespace-nowrap">Secondary</span>
              <span className="text-gray-400 text-sm">Alternative action</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block px-3 py-1 bg-slate-700 text-gray-300 text-xs rounded font-medium whitespace-nowrap">Tertiary</span>
              <span className="text-gray-400 text-sm">Supplementary action</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs rounded font-medium whitespace-nowrap">Destructive</span>
              <span className="text-gray-400 text-sm">Delete or irreversible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
