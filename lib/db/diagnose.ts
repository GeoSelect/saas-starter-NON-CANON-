#!/usr/bin/env node

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('✓ SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
console.log('✓ ANON_KEY:', ANON_KEY ? '✓' : '✗');
console.log('✓ SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌ Missing required environment variables');
  process.exit(1);
}

// Test 1: Check if reports table exists
async function checkTableExists() {
  console.log('\n📋 Checking if reports table exists...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports?limit=1`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    console.log(`   Status: ${res.status}`);
    if (res.status === 200) {
      console.log('   ✅ Reports table EXISTS');
      const data = await res.json();
      console.log(`   📊 Currently has ${data.length} records`);
      return true;
    } else if (res.status === 404) {
      console.log('   ❌ Reports table does NOT exist (404)');
      return false;
    } else {
      const text = await res.text();
      console.log(`   ⚠️  Status: ${res.status} - ${text}`);
      return false;
    }
  } catch (e) {
    console.error('   ❌ Error:', e);
    return false;
  }
}

// Test 2: Try to insert a test report
async function insertTestReport() {
  console.log('\n📝 Attempting to insert test report...');

  const testReport = {
    id: 'test-report-' + Date.now(),
    team_id: 1,
    user_id: 1,
    title: 'Test Report',
    description: 'This is a test',
    parcel_id: 'test-parcel',
    address: '123 Main St',
    jurisdiction: 'Test City',
    zoning: 'C-1',
    parcel_snapshot: { id: 'test', address: '123 Main St' },
    status: 'draft',
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(testReport),
    });

    const responseText = await res.text();
    console.log(`   Status: ${res.status}`);

    if (res.status === 201) {
      console.log('   ✅ Insert successful!');
      try {
        const data = JSON.parse(responseText);
        console.log(`   Created report: ${data.id}`);
      } catch {}
      return true;
    } else {
      console.log(`   ❌ Insert failed: ${responseText}`);
      return false;
    }
  } catch (e) {
    console.error('   ❌ Error:', e);
    return false;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('GeoSelect Database Diagnostics');
  console.log('═'.repeat(60));

  const tableExists = await checkTableExists();

  if (!tableExists) {
    console.log('\n⚠️  The reports table does not exist yet.');
    console.log('\n🔧 To create it, run this SQL in your Supabase dashboard:');
    console.log('   → SQL Editor → New query');
    console.log('   → Copy all content from: lib/db/migrations/create-all-mock-data.sql');
    console.log('   → Click Execute\n');
    process.exit(1);
  }

  const insertWorked = await insertTestReport();

  console.log('\n' + '═'.repeat(60));
  if (insertWorked) {
    console.log('✅ Database is configured and working!');
    console.log('   Now refresh http://localhost:3000/dashboard/reports');
  } else {
    console.log('⚠️  Database needs configuration');
  }
  console.log('═'.repeat(60) + '\n');
}

main();
