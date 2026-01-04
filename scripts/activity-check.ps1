# Activity instrumentation verification script (PowerShell)
# Ensures all activity logging infrastructure is in place
# Exit: 0 (true) if all checks pass, 1 (false) otherwise

param(
  [switch]$Verbose
)

$errors = @()
$projectRoot = Get-Location

function Test-FileExists {
  param(
    [string]$Path,
    [string]$Description
  )
  if (-not (Test-Path $Path -PathType Leaf)) {
    $errors += "Missing: $Description ($Path)"
    if ($Verbose) { Write-Host "  ✗ $Description" -ForegroundColor Red }
    return $false
  }
  if ($Verbose) { Write-Host "  ✓ $Description" -ForegroundColor Green }
  return $true
}

function Test-DirectoryExists {
  param(
    [string]$Path,
    [string]$Description
  )
  if (-not (Test-Path $Path -PathType Container)) {
    $errors += "Missing: $Description ($Path)"
    if ($Verbose) { Write-Host "  ✗ $Description" -ForegroundColor Red }
    return $false
  }
  if ($Verbose) { Write-Host "  ✓ $Description" -ForegroundColor Green }
  return $true
}

Write-Host "Verifying activity instrumentation..." -ForegroundColor Cyan

# Activity type definitions
Test-FileExists "lib/types/activity.ts" "Activity type definitions" | Out-Null

# Activity logger helpers
Test-FileExists "lib/helpers/activity-logger.ts" "Activity logger helpers" | Out-Null

# Database migration
Test-FileExists "lib/db/migrations/20260104_activities_audit_log.sql" "Activities table migration" | Out-Null

# API endpoints for new activity types
Test-FileExists "app/api/workspaces/[workspace_id]/snapshots/route.ts" "Snapshots endpoint" | Out-Null
Test-FileExists "app/api/workspaces/[workspace_id]/parcels/selected/route.ts" "Parcel selected endpoint" | Out-Null
Test-FileExists "app/api/workspaces/[workspace_id]/rules/evaluate/route.ts" "Rules evaluate endpoint" | Out-Null
Test-FileExists "app/api/workspaces/[workspace_id]/reports/share/route.ts" "Report share endpoint" | Out-Null
Test-FileExists "app/api/workspaces/[workspace_id]/activities/route.ts" "Activities audit endpoint" | Out-Null
Test-FileExists "app/api/share-links/route.ts" "Share links endpoint" | Out-Null

# Check TypeScript compilation
Write-Host "Running TypeScript type check..." -ForegroundColor Cyan
$tsOutput = pnpm tsc --noEmit 2>&1
if ($LASTEXITCODE -ne 0) {
  $errors += "TypeScript type checking failed"
  if ($Verbose) { Write-Host $tsOutput -ForegroundColor Red }
}

# Check test suite
Write-Host "Running tests..." -ForegroundColor Cyan
$testOutput = pnpm test --run 2>&1
if ($LASTEXITCODE -ne 0) {
  $errors += "Test suite failed"
  if ($Verbose) { Write-Host $testOutput -ForegroundColor Red }
}

# Report results
if ($errors.Count -eq 0) {
  Write-Host "true"
  exit 0
} else {
  Write-Host "false" -ForegroundColor Red
  foreach ($error in $errors) {
    Write-Host "  ✗ $error" -ForegroundColor Yellow
  }
  exit 1
}
