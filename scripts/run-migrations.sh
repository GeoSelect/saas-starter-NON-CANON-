#!/bin/bash
# Database Migration Runner for DigitalOcean PostgreSQL
#
# This script runs migrations against your DigitalOcean PostgreSQL database
# Set the environment variables below with your credentials

# ============================================================================
# CONFIGURATION (from your .env.local)
# ============================================================================
export PGHOST="geoselect-pg17-sfo2-do-user-30702471-0.m.db.ondigitalocean.com"
export PGPORT="25060"
export PGUSER="doadmin"
export PGDATABASE="defaultdb"
# export PGPASSWORD="your-password"  # (optional: set if you don't want to be prompted)

# ============================================================================
# RUN MIGRATIONS
# ============================================================================
# This will prompt for password if PGPASSWORD is not set

echo "🔄 Running migrations on DigitalOcean PostgreSQL..."
echo "   Host: $PGHOST"
echo "   Port: $PGPORT"
echo "   Database: $PGDATABASE"
echo "   User: $PGUSER"
echo ""

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
  echo "❌ Error: supabase/migrations directory not found"
  echo "   Make sure you're running this from the project root"
  exit 1
fi

# Get all migration files (sorted by name)
MIGRATIONS=$(ls supabase/migrations/*.sql 2>/dev/null | sort)

if [ -z "$MIGRATIONS" ]; then
  echo "⚠️  No migration files found in supabase/migrations/"
  exit 1
fi

echo "Found migration files:"
for file in $MIGRATIONS; do
  echo "  - $(basename $file)"
done
echo ""

# Run each migration
SUCCESS_COUNT=0
ERROR_COUNT=0

for file in $MIGRATIONS; do
  FILENAME=$(basename $file)
  echo "Running: $FILENAME..."
  
  # Run the migration
  # Note: psql will prompt for password if PGPASSWORD not set
  psql "host=$PGHOST port=$PGPORT user=$PGUSER dbname=$PGDATABASE sslmode=require" \
    -f "$file"
  
  if [ $? -eq 0 ]; then
    echo "  ✓ $FILENAME completed"
    ((SUCCESS_COUNT++))
  else
    echo "  ❌ $FILENAME FAILED"
    ((ERROR_COUNT++))
  fi
  echo ""
done

# Summary
echo "========================================"
echo "Migration Summary"
echo "========================================"
echo "✓ Successful: $SUCCESS_COUNT"
echo "❌ Failed: $ERROR_COUNT"

if [ $ERROR_COUNT -gt 0 ]; then
  echo ""
  echo "⚠️  Some migrations failed. Check the errors above."
  exit 1
else
  echo ""
  echo "🎉 All migrations completed successfully!"
  echo ""
  echo "Next steps:"
  echo "  1. Verify tables were created:"
  echo "     psql \"host=\$PGHOST port=\$PGPORT user=\$PGUSER dbname=\$PGDATABASE sslmode=require\" -c \"\\dt\""
  echo "  2. Start the development server:"
  echo "     pnpm dev"
  exit 0
fi
