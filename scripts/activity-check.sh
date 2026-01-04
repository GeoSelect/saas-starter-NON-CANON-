#!/bin/bash
# Activity instrumentation verification script
# Ensures all activity logging infrastructure is in place
# Exit: 0 (true) if all checks pass, 1 (false) otherwise

set -e

ERRORS=()

# Check if required files exist
check_file() {
  local file=$1
  local description=$2
  if [ ! -f "$file" ]; then
    ERRORS+=("Missing: $description ($file)")
    return 1
  fi
  return 0
}

# Check if directory exists
check_dir() {
  local dir=$1
  local description=$2
  if [ ! -d "$dir" ]; then
    ERRORS+=("Missing: $description ($dir)")
    return 1
  fi
  return 0
}

echo "Verifying activity instrumentation..."

# Activity type definitions
check_file "lib/types/activity.ts" "Activity type definitions" || true

# Activity logger helpers
check_file "lib/helpers/activity-logger.ts" "Activity logger helpers" || true

# Database migration
check_file "lib/db/migrations/20260104_activities_audit_log.sql" "Activities table migration" || true

# API endpoints for new activity types
check_file "app/api/workspaces/[workspace_id]/snapshots/route.ts" "Snapshots endpoint" || true
check_file "app/api/workspaces/[workspace_id]/parcels/selected/route.ts" "Parcel selected endpoint" || true
check_file "app/api/workspaces/[workspace_id]/rules/evaluate/route.ts" "Rules evaluate endpoint" || true
check_file "app/api/workspaces/[workspace_id]/reports/share/route.ts" "Report share endpoint" || true
check_file "app/api/workspaces/[workspace_id]/activities/route.ts" "Activities audit endpoint" || true
check_file "app/api/share-links/route.ts" "Share links endpoint" || true

# Check TypeScript compilation
echo "Running TypeScript type check..."
if ! pnpm tsc --noEmit 2>/dev/null; then
  ERRORS+=("TypeScript type checking failed")
fi

# Check test suite
echo "Running tests..."
if ! pnpm test --run 2>/dev/null; then
  ERRORS+=("Test suite failed")
fi

# Report results
if [ ${#ERRORS[@]} -eq 0 ]; then
  echo "true"
  exit 0
else
  echo "false" >&2
  for error in "${ERRORS[@]}"; do
    echo "  ✗ $error" >&2
  done
  exit 1
fi
