#!/bin/bash
# Database Migration Guide for Supabase
#
# This guide explains how to run migrations and seeds using Supabase
# instead of direct PostgreSQL commands.
#
# ⚠️  SECURITY: Never expose SUPABASE_SERVICE_ROLE_KEY in shell commands
# Always use Supabase CLI or Dashboard for production migrations

# ============================================================================
# SETUP: Environment Variables
# ============================================================================
# Copy your Supabase credentials to .env.local (NEVER commit):
#
#   SUPABASE_URL=https://your-project.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
#
# Get these from: https://supabase.com/dashboard/project/_/settings/api

# ============================================================================
# OPTION 1: Using Supabase CLI (RECOMMENDED)
# ============================================================================
# Install Supabase CLI: https://supabase.com/docs/guides/cli/getting-started
#
# Link to your project:
#   supabase link --project-ref your-project-id
#
# Push migrations:
#   supabase migration up
#
# View logs:
#   supabase migration list
#
# Push to production:
#   supabase db push --linked

# ============================================================================
# OPTION 2: Using SQL Editor (Via Supabase Dashboard - EASIEST)
# ============================================================================
# 1. Go to: https://supabase.com/dashboard/project/_/sql
# 2. Create a new query
# 3. Copy migration SQL from: supabase/migrations/
# 4. Run the query
#
# Repeat for each migration file in order (001, 002, etc.)

# ============================================================================
# OPTION 3: Using psql with Supabase Connection String
# ============================================================================
# Get your direct database URL from:
#   https://supabase.com/dashboard/project/_/settings/database
#
# Format:
#   postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
#
# Then run:
#
#   psql "postgresql://postgres.xxx:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require" \
#     -f supabase/migrations/001_initial_schema.sql

# ============================================================================
# OPTION 4: Using Node.js Script (For Automated Deployments)
# ============================================================================
# Create scripts/migrate.js:
#
#   import { createClient } from '@supabase/supabase-js';
#   import fs from 'fs';
#
#   const supabase = createClient(
#     process.env.SUPABASE_URL,
#     process.env.SUPABASE_SERVICE_ROLE_KEY
#   );
#
#   const migration = fs.readFileSync('supabase/migrations/001_initial_schema.sql', 'utf-8');
#   const { error } = await supabase.rpc('exec_sql', { sql: migration });
#   if (error) console.error('Migration failed:', error);
#
# Run:
#   node scripts/migrate.js

# ============================================================================
# MIGRATION FILE STRUCTURE
# ============================================================================
# Store all migrations in: supabase/migrations/
#
# Naming convention:
#   001_create_tables.sql
#   002_add_indexes.sql
#   003_create_functions.sql
#   etc.
#
# Each file should be idempotent (use IF NOT EXISTS, etc.)

# ============================================================================
# SEEDING (DEVELOPMENT ONLY)
# ============================================================================
# After migrations, optionally seed test data:
#
#   supabase db seed
#
# Or manually run seed script:
#
#   psql "postgresql://..." -f supabase/seeds/dev.sql

echo "✓ See comments above for migration options"
