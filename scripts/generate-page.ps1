param(
    [Parameter(Mandatory=$true)]
    [string]$PageName,
    [Parameter(Mandatory=$true)]
    [string]$RoutePath,
    [Parameter(Mandatory=$true)]
    [string]$Category
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$appDir = Join-Path $projectRoot "app"
$RoutePath = $RoutePath.TrimStart('/')
$routeDir = Join-Path $appDir $RoutePath

if (-not (Test-Path $appDir)) {
    Write-Error "app/ directory not found at $appDir"
    exit 1
}

if (-not (Test-Path $routeDir)) {
    New-Item -ItemType Directory -Path $routeDir -Force | Out-Null
    Write-Host "Created directory: $routeDir"
}

$pageContent = @'
'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/preview/routes" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">PAGE_TITLE</h1>
              <p className="text-sm text-gray-400">/ROUTE_HERE</p>
            </div>
          </div>
          <div className="text-xs bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
            CATEGORY_HERE
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">PAGE_TITLE</h2>
            <p className="text-gray-400 mb-8">This is a scaffolded page. Add your content here.</p>
            <div className="max-w-md mx-auto bg-slate-700/50 border border-slate-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Getting Started</h3>
              <p className="text-sm text-gray-300 mb-4">Replace this section with your page content.</p>
              <button
                onClick={() => setLoading(!loading)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Try It'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'@

$pageContent = $pageContent -replace 'PAGE_TITLE', $PageName
$pageContent = $pageContent -replace 'ROUTE_HERE', $RoutePath
$pageContent = $pageContent -replace 'CATEGORY_HERE', $Category

$pageFile = Join-Path $routeDir "page.tsx"
Set-Content -Path $pageFile -Value $pageContent -Encoding UTF8
Write-Host ""
Write-Host "Page created: $pageFile"
Write-Host ""
Write-Host "Route: /$RoutePath"
Write-Host "Category: $Category"
Write-Host ""
Write-Host "Add this to app/(dashboard)/preview/routes/page.tsx routes array:"
Write-Host ""
Write-Host "  {"
Write-Host "    path: '/$RoutePath',"
Write-Host "    name: 'New - $PageName',"
Write-Host "    category: '$Category'"
Write-Host "  },"
Write-Host ""
