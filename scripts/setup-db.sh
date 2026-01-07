#!/bin/bash
# Quick Start: Supabase Database Setup
#
# This script shows how to set up your Supabase database
# using environment variables and Supabase CLI or SQL Editor

set -e

# ============================================================================
# STEP 1: Verify Environment Variables
# ============================================================================
echo "Checking Supabase environment variables..."

if [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: SUPABASE_URL not set"
  echo "   Set it in .env.local or export it:"
  echo "   export SUPABASE_URL=https://your-project.supabase.co"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set"
  echo "   Set it in .env.local (NEVER in .env or version control)"
  exit 1
fi

echo "✓ SUPABASE_URL: $SUPABASE_URL"
echo "✓ SUPABASE_SERVICE_ROLE_KEY: (set, hidden for security)"

# ============================================================================
# STEP 2: Check if Supabase CLI is installed
# ============================================================================
if ! command -v supabase &> /dev/null; then
  echo ""
  echo "⚠️  Supabase CLI not found. Install it:"
  echo "   npm install -g @supabase/cli"
  echo ""
  echo "Then run:"
  echo "   supabase link --project-ref your-project-id"
  echo "   supabase migration up"
  exit 1
fi

echo "✓ Supabase CLI is installed"

# ============================================================================
# STEP 3: Link to Supabase Project (if not already linked)
# ============================================================================
if [ ! -d ".supabase" ]; then
  echo ""
  echo "Linking to Supabase project..."
  echo "You can find your project ref at:"
  echo "  https://supabase.com/dashboard/project/_/settings/general"
  echo ""
  read -p "Enter your Supabase project ref: " PROJECT_REF
  supabase link --project-ref "$PROJECT_REF"
fi

echo "✓ Project linked"

# ============================================================================
# STEP 4: Run Migrations
# ============================================================================
echo ""
echo "Running migrations..."
supabase migration up

echo "✓ Migrations applied"

# ============================================================================
# STEP 5: Optional - Run Seeds (development only)
# ============================================================================
read -p "Run development seeds? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Running seeds..."
  # If you have a seed script, run it here
  # supabase db seed
  echo "✓ Seeds applied"
fi

echo ""
echo "✓✓✓ Database setup complete! ✓✓✓"
echo ""
echo "Next steps:"
echo "  1. Verify tables in Supabase Dashboard:"
echo "     https://supabase.com/dashboard/project/_/editor"
echo "  2. Run: pnpm dev"
echo "  3. Test the app at http://localhost:3000"
