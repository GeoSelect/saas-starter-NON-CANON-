# Database Migration Runner for DigitalOcean PostgreSQL (Windows)
#
# This script runs migrations against your DigitalOcean PostgreSQL database
# Usage: .\scripts\run-migrations.ps1

param(
  [string]$Password = ""
)

# ============================================================================
# CONFIGURATION (from your .env.local)
# ============================================================================
$PGHOST = "geoselect-pg17-sfo2-do-user-30702471-0.m.db.ondigitalocean.com"
$PGPORT = "25060"
$PGUSER = "doadmin"
$PGDATABASE = "defaultdb"
# $PGPASSWORD = ""  # (optional: pass as parameter or set here)

# ============================================================================
# VALIDATION
# ============================================================================
Write-Host "🔄 Running migrations on DigitalOcean PostgreSQL..." -ForegroundColor Cyan
Write-Host "   Host: $PGHOST"
Write-Host "   Port: $PGPORT"
Write-Host "   Database: $PGDATABASE"
Write-Host "   User: $PGUSER"
Write-Host ""

if (-not (Test-Path "supabase/migrations")) {
  Write-Host "❌ Error: supabase/migrations directory not found" -ForegroundColor Red
  Write-Host "   Make sure you're running this from the project root"
  exit 1
}

# Get all migration files (sorted by name)
$migrations = Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" | Sort-Object Name

if ($migrations.Count -eq 0) {
  Write-Host "⚠️  No migration files found in supabase/migrations/" -ForegroundColor Yellow
  exit 1
}

Write-Host "Found migration files:" -ForegroundColor Green
foreach ($file in $migrations) {
  Write-Host "  - $($file.Name)"
}
Write-Host ""

# ============================================================================
# RUN MIGRATIONS
# ============================================================================
$successCount = 0
$errorCount = 0

foreach ($file in $migrations) {
  Write-Host "Running: $($file.Name)..." -ForegroundColor Yellow
  
  # Build psql connection string
  $connectionString = "host=$PGHOST port=$PGPORT user=$PGUSER dbname=$PGDATABASE sslmode=require"
  
  # Run the migration
  if ($Password) {
    # If password provided, set it as environment variable
    $env:PGPASSWORD = $Password
  }
  
  try {
    # Execute migration
    psql $connectionString -f $file.FullName 2>&1 | Tee-Object -Variable output | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  ✓ $($file.Name) completed" -ForegroundColor Green
      $successCount++
    } else {
      Write-Host "  ❌ $($file.Name) FAILED" -ForegroundColor Red
      Write-Host ($output -join "`n") -ForegroundColor Red
      $errorCount++
    }
  } catch {
    Write-Host "  ❌ Error running migration: $_" -ForegroundColor Red
    $errorCount++
  }
  
  Write-Host ""
}

# Clear password from environment
if ($Password) {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })

if ($errorCount -gt 0) {
  Write-Host ""
  Write-Host "⚠️  Some migrations failed. Check the errors above." -ForegroundColor Red
  exit 1
} else {
  Write-Host ""
  Write-Host "🎉 All migrations completed successfully!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Next steps:" -ForegroundColor Cyan
  Write-Host "  1. Verify tables were created:" -ForegroundColor Cyan
  Write-Host "     psql ""host=`$PGHOST port=`$PGPORT user=`$PGUSER dbname=`$PGDATABASE sslmode=require"" -c ""\dt""" -ForegroundColor Gray
  Write-Host "  2. Start the development server:" -ForegroundColor Cyan
  Write-Host "     pnpm dev" -ForegroundColor Gray
  exit 0
}
