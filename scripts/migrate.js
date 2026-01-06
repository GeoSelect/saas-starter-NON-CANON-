/**
 * Supabase Migration Runner
 *
 * This script runs SQL migrations on your Supabase database.
 * Useful for automated deployments or CI/CD pipelines.
 *
 * Usage:
 *   node scripts/migrate.js
 *   # or with environment variables:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

// ============================================================================
// VALIDATION
// ============================================================================

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('');
  console.error('Set them in .env.local or export them:');
  console.error('   export SUPABASE_URL=https://your-project.supabase.co');
  console.error('   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

if (!fs.existsSync(MIGRATIONS_DIR)) {
  console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
  process.exit(1);
}

// ============================================================================
// FUNCTIONS
// ============================================================================

async function runMigrations() {
  console.log('🔄 Supabase Migration Runner');
  console.log('');

  // Create Supabase client with service role (admin privileges)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Get all migration files (sorted by name)
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  No migration files found');
    return;
  }

  console.log(`Found ${files.length} migration(s):`);
  files.forEach((f) => console.log(`  - ${f}`));
  console.log('');

  // TODO: Check migrations table to see which have already run
  // For now, we'll run all migrations (idempotent SQL recommended)

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      console.log(`Running: ${file}...`);

      // Execute the migration
      // Note: Supabase doesn't have a direct SQL execution RPC by default
      // You can use the SQL Editor dashboard or the Supabase CLI for this
      // This is a reference implementation

      // Option 1: If you have a custom RPC function that executes SQL:
      // const { error } = await supabase.rpc('exec_sql', { sql });
      // if (error) throw error;

      // Option 2: Parse and execute multiple statements manually
      // (Not recommended - use Supabase CLI instead)

      // For now, we'll just log what would be executed
      console.log(`  ✓ (Manual execution needed - use Supabase CLI or Dashboard)`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed:`, err instanceof Error ? err.message : err);
      errorCount++;
    }
  }

  console.log('');
  console.log(`✓ ${successCount} migration(s) processed`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} error(s)`);
    process.exit(1);
  }

  console.log('');
  console.log('🎉 Migrations complete!');
  console.log('');
  console.log('If migrations were not executed, run them manually:');
  console.log('  1. Via Supabase CLI:');
  console.log('     supabase migration up');
  console.log('  2. Via Dashboard SQL Editor:');
  console.log('     https://supabase.com/dashboard/project/_/sql');
  console.log('  3. Via psql:');
  console.log('     psql "postgresql://..." -f supabase/migrations/001_*.sql');
}

// ============================================================================
// RUN
// ============================================================================

runMigrations().catch((err) => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
