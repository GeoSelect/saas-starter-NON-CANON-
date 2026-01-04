// Hardcode Supabase credentials from known location
const SUPABASE_URL = 'https://sixbxlulhabiekobllgt.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_DY6o8ycTiWDigDb4cZiPFA_FWo7DMxO';

console.log('═'.repeat(60));
console.log('🔍 Database Diagnostic');
console.log('═'.repeat(60));
console.log('\nConnecting to:', SUPABASE_URL);

async function diagnose() {
  try {
    console.log('\n📋 Checking for reports table...');
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports?limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    console.log(`   Status: ${res.status}`);
    
    if (res.status === 200) {
      const data = await res.json();
      console.log(`\n✅ Reports table EXISTS`);
      console.log(`   📊 Current records: ${data.length}`);
      
      if (data.length === 0) {
        console.log('\n🔧 Table is empty. To add test data:');
        console.log('   1. Go to: https://app.supabase.com/');
        console.log('   2. Project: sixbxlulhabiekobllgt');
        console.log('   3. SQL Editor → New Query');
        console.log('   4. Paste entire content from:');
        console.log('      lib/db/migrations/create-all-mock-data.sql');
        console.log('   5. Click Execute\n');
      } else {
        console.log('\n✅ Database is ready! Data is populated.\n');
      }
    } else if (res.status === 404 || res.status === 400) {
      console.log('\n❌ Reports table does NOT exist\n');
      console.log('🔧 To create all tables with mock data:');
      console.log('   1. Go to: https://app.supabase.com/');
      console.log('   2. Project: sixbxlulhabiekobllgt');
      console.log('   3. SQL Editor → New Query');
      console.log('   4. Copy entire content from:');
      console.log('      lib/db/migrations/create-all-mock-data.sql');
      console.log('   5. Click Execute\n');
    } else {
      const text = await res.text();
      console.log(`\n⚠️  Error: ${res.status}`);
      console.log(`   Response: ${text.substring(0, 500)}\n`);
    }
  } catch (e) {
    console.error('\n❌ Connection error:', e.message, '\n');
  }
}

diagnose();
