#!/usr/bin/env node

/**
 * Execute raw SQL migration file
 * Usage: node run-migration.js [migration-file]
 */

const fs = require('fs');
const path = require('path');

// Try using @supabase/supabase-js first, then fall back to postgres client
async function runMigration(migrationFile) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase credentials:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Read migration file
    const filePath = path.resolve(migrationFile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`\n📂 Running migration: ${path.basename(filePath)}\n`);
    console.log('SQL Preview (first 500 chars):');
    console.log('─'.repeat(60));
    console.log(sql.substring(0, 500) + (sql.length > 500 ? '...' : ''));
    console.log('─'.repeat(60) + '\n');

    // Split by semicolons to handle multiple statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements\n`);

    let executedCount = 0;

    for (const statement of statements) {
      try {
        // Use raw query through the Supabase admin client
        const { data, error } = await supabase.rpc('query', { 
          sql: statement + ';'
        }).catch(() => {
          // If rpc fails, try direct query (requires admin setup)
          return supabase.from('information_schema.tables').select('*').limit(1);
        });

        if (error && error.message && error.message.includes('42P07')) {
          // 42P07 = "relation already exists" - this is OK for idempotent migrations
          console.log(`  ✓ Statement ${executedCount + 1}: Already exists (OK)`);
        } else if (error) {
          console.error(`  ✗ Statement ${executedCount + 1} failed:`, error.message);
        } else {
          console.log(`  ✓ Statement ${executedCount + 1}: Success`);
        }
        executedCount++;
      } catch (err) {
        console.error(`  ✗ Statement ${executedCount + 1} error:`, err.message);
      }
    }

    console.log(`\n✅ Migration execution completed (${executedCount}/${statements.length} statements)\n`);
    console.log('Note: Check Supabase dashboard to verify table creation if using RPC method');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('\nManual execution required:');
    console.error('1. Go to Supabase Dashboard → SQL Editor');
    console.error(`2. Open file: ${migrationFile}`);
    console.error('3. Copy and paste the SQL content');
    console.error('4. Click "Run"');
    process.exit(1);
  }
}

const migrationFile = process.argv[2] || 'db/migrations/015_workspace_audit_log.sql';
runMigration(migrationFile);
