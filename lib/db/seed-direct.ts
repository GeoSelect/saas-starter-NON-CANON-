import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

async function seedReports() {
  try {
    console.log('🔄 Seeding reports directly via REST API...\n');

    // Insert reports using REST API
    const reports = [
      {
        id: 'report-1',
        team_id: 1,
        user_id: 1,
        title: 'Google HQ Zoning Analysis',
        description: 'Initial zoning review for potential development.',
        parcel_id: 'parcel-1',
        address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
        apn: '168-41-085',
        jurisdiction: 'Mountain View',
        zoning: 'C-2',
        parcel_snapshot: {
          id: 'parcel-1',
          address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
        },
        status: 'published',
        tags: ['verified', 'commercial'],
      },
      {
        id: 'report-2',
        team_id: 1,
        user_id: 1,
        title: 'Apple Park Compliance Check',
        description: 'Environmental compliance review.',
        parcel_id: 'parcel-2',
        address: '1 Apple Park Way, Cupertino, CA 95014',
        apn: '359-1-001',
        jurisdiction: 'Cupertino',
        zoning: 'P(General)',
        parcel_snapshot: {
          id: 'parcel-2',
          address: '1 Apple Park Way, Cupertino, CA 95014',
        },
        status: 'published',
        tags: ['compliant', 'approved'],
      },
    ];

    const baseUrl = `${supabaseUrl}/rest/v1/reports`;

    for (const report of reports) {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`⚠️  Insert failed for ${report.title}:`, error);
      } else {
        console.log(`✅ Created: ${report.title}`);
      }
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedReports();
