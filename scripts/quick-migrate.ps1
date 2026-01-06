#!/usr/bin/env pwsh
# Quick Migration Runner - Interactive (Prompts for password)
#
# Usage: pwsh scripts\quick-migrate.ps1

$PGHOST = "geoselect-pg17-sfo2-do-user-30702471-0.m.db.ondigitalocean.com"
$PGPORT = "25060"
$PGUSER = "doadmin"
$PGDATABASE = "defaultdb"

Write-Host "🔄 DigitalOcean PostgreSQL Migrations" -ForegroundColor Cyan
Write-Host "Host: $PGHOST" -ForegroundColor Gray
Write-Host "Database: $PGDATABASE" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: psql will prompt for your password" -ForegroundColor Yellow
Write-Host ""

$connectionString = "host=$PGHOST port=$PGPORT user=$PGUSER dbname=$PGDATABASE sslmode=require"

# Get migration files
$migrations = Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" -ErrorAction Stop | 
  Where-Object { $_.Name -ne "MIGRATION_TEMPLATE.sql" } |
  Sort-Object Name

if ($migrations.Count -eq 0) {
  Write-Host "❌ No migration files found" -ForegroundColor Red
  exit 1
}

Write-Host "Found $($migrations.Count) migrations:" -ForegroundColor Green
$migrations | ForEach-Object { Write-Host "  ✓ $($_.Name)" -ForegroundColor Gray }
Write-Host ""

$proceed = Read-Host "Run migrations? (y/n)"
if ($proceed -ne "y") {
  Write-Host "Cancelled" -ForegroundColor Yellow
  exit 0
}

Write-Host ""

# Run migrations
$success = 0
$failed = 0

foreach ($file in $migrations) {
  Write-Host "→ $($file.Name)" -ForegroundColor Yellow -NoNewline
  
  try {
    psql $connectionString -f $file.FullName -q 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
      Write-Host " ✓" -ForegroundColor Green
      $success++
    } else {
      Write-Host " ✗" -ForegroundColor Red
      $failed++
    }
  } catch {
    Write-Host " ✗" -ForegroundColor Red
    $failed++
  }
}

Write-Host ""
Write-Host "Done: $success/$($migrations.Count) completed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -eq 0) {
  Write-Host "✅ Migrations successful!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Next: pnpm dev" -ForegroundColor Cyan
}
