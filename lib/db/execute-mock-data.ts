import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedDatabase() {
  try {
    console.log('🔄 Seeding mock data...\n');

    // 1. Create users
    console.log('📝 Creating users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          name: 'John Developer',
          email: 'john@example.com',
          password_hash: 'hashed_password_1',
          role: 'owner',
        },
        {
          name: 'Jane Analyst',
          email: 'jane@example.com',
          password_hash: 'hashed_password_2',
          role: 'member',
        },
        {
          name: 'Bob Manager',
          email: 'bob@example.com',
          password_hash: 'hashed_password_3',
          role: 'member',
        },
      ])
      .select();

    if (usersError && usersError.code !== 'PGRST205') {
      console.log('  ⚠️  Users error (may already exist):', usersError.message);
    } else if (users) {
      console.log(`  ✅ Created ${users.length} users`);
    }

    // 2. Create teams
    console.log('📝 Creating teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .insert([
        {
          name: 'Acme Real Estate',
          plan_name: 'premium',
          subscription_status: 'active',
        },
        {
          name: 'Global Development Corp',
          plan_name: 'professional',
          subscription_status: 'active',
        },
        {
          name: 'Tech Properties LLC',
          plan_name: 'starter',
          subscription_status: 'trial',
        },
      ])
      .select();

    if (teamsError && teamsError.code !== 'PGRST205') {
      console.log('  ⚠️  Teams error (may already exist):', teamsError.message);
    } else if (teams) {
      console.log(`  ✅ Created ${teams.length} teams`);
    }

    // Get the actual IDs (fallback to 1 if tables don't exist yet)
    const userId1 = users?.[0]?.id || 1;
    const userId2 = users?.[1]?.id || 2;
    const userId3 = users?.[2]?.id || 3;
    const teamId1 = teams?.[0]?.id || 1;
    const teamId2 = teams?.[1]?.id || 2;
    const teamId3 = teams?.[2]?.id || 3;

    // 3. Create reports
    console.log('📝 Creating reports with snapshots...');
    const reports = [
      {
        id: 'report-1',
        team_id: teamId1,
        user_id: userId1,
        title: 'Google HQ Zoning Analysis',
        description: 'Initial zoning review for potential development. This property shows strong commercial viability with current C-2 zoning classification.',
        parcel_id: 'parcel-1',
        address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
        apn: '168-41-085',
        jurisdiction: 'Mountain View',
        zoning: 'C-2',
        parcel_snapshot: {
          id: 'parcel-1',
          address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
          apn: '168-41-085',
          jurisdiction: 'Mountain View',
          zoning: 'C-2',
          lat: 37.4224764,
          lng: -122.0842499,
          sources: ['Assessor', 'Zoning'],
          notes: 'Google HQ - Mountain View Campus',
        },
        findings: {
          compatibility: 'Commercial use verified',
          restrictions: 'Height limited to 75ft',
          area_sqft: 65000,
          assessment_value: '$2.8M',
        },
        tags: ['verified', 'commercial', 'priority'],
        status: 'published',
      },
      {
        id: 'report-2',
        team_id: teamId1,
        user_id: userId2,
        title: 'Apple Park Compliance Check',
        description: 'Environmental compliance review and regulatory assessment.',
        parcel_id: 'parcel-2',
        address: '1 Apple Park Way, Cupertino, CA 95014',
        apn: '359-1-001',
        jurisdiction: 'Cupertino',
        zoning: 'P(General)',
        parcel_snapshot: {
          id: 'parcel-2',
          address: '1 Apple Park Way, Cupertino, CA 95014',
          apn: '359-1-001',
          jurisdiction: 'Cupertino',
          zoning: 'P(General)',
          lat: 37.3349285,
          lng: -122.0090211,
          sources: ['Assessor'],
          notes: 'Apple Park - Corporate Headquarters',
        },
        findings: {
          status: 'Compliant',
          environmental: 'All requirements met',
          wetlands: 'None identified',
          flood_zone: 'Not in flood zone',
        },
        tags: ['compliant', 'reviewed', 'approved'],
        status: 'published',
      },
      {
        id: 'report-3',
        team_id: teamId1,
        user_id: userId1,
        title: 'Goldman Sachs Mixed Use Development',
        description: 'Development potential assessment with phased implementation strategy.',
        parcel_id: 'parcel-3',
        address: '101 Hudson Street, Jersey City, NJ 07302',
        apn: 'B03-P-011',
        jurisdiction: 'Jersey City',
        zoning: 'Mixed Use',
        parcel_snapshot: {
          id: 'parcel-3',
          address: '101 Hudson Street, Jersey City, NJ 07302',
          apn: 'B03-P-011',
          jurisdiction: 'Jersey City',
          zoning: 'Mixed Use',
          lat: 40.7173162,
          lng: -74.0113616,
          sources: ['Assessor'],
          notes: 'Goldman Sachs Headquarters',
        },
        findings: {
          development_potential: 'High',
          recommendation: 'Proceed with development application',
          estimated_roi: '15-18%',
          timeline: '24 months',
        },
        tags: ['high-potential', 'development', 'recommended'],
        status: 'published',
      },
      {
        id: 'report-4',
        team_id: teamId2,
        user_id: userId3,
        title: 'Grand Central Terminal Area Review',
        description: 'Historic district considerations and zoning constraints analysis.',
        parcel_id: 'parcel-4',
        address: '60 East 42nd Street, New York, NY 10165',
        apn: 'MN-2567-001',
        jurisdiction: 'New York',
        zoning: 'C5-2',
        parcel_snapshot: {
          id: 'parcel-4',
          address: '60 East 42nd Street, New York, NY 10165',
          apn: 'MN-2567-001',
          jurisdiction: 'New York',
          zoning: 'C5-2',
          lat: 40.7527621,
          lng: -73.9772471,
          sources: ['Assessor', 'Zoning'],
          notes: 'Grand Central Terminal area',
        },
        findings: {
          historic_district: true,
          landmarks: 'Yes - within historic district',
          restrictions: 'Strict facade requirements',
          notes: 'Requires LPC approval for any modifications',
        },
        tags: ['historic', 'constrained', 'requires-approval'],
        status: 'draft',
      },
      {
        id: 'report-5',
        team_id: teamId2,
        user_id: userId3,
        title: 'Manhattan Office Tower Assessment',
        description: 'Premium office space utilization and market analysis.',
        parcel_id: 'parcel-5',
        address: '650 Fifth Avenue, New York, NY 10019',
        apn: 'MN-1234-005',
        jurisdiction: 'New York',
        zoning: 'C5-4',
        parcel_snapshot: {
          id: 'parcel-5',
          address: '650 Fifth Avenue, New York, NY 10019',
          apn: 'MN-1234-005',
          jurisdiction: 'New York',
          zoning: 'C5-4',
          lat: 40.7614,
          lng: -73.9776,
          sources: ['Assessor'],
          notes: 'Manhattan office tower',
        },
        findings: {
          property_type: 'Office',
          floor_area: 850000,
          market_rent: '$75-85/sqft/year',
          occupancy: '98%',
        },
        tags: ['office', 'premium', 'revenue-generating'],
        status: 'published',
      },
      {
        id: 'report-6',
        team_id: teamId3,
        user_id: userId2,
        title: 'Suburban Mixed Use Plot Analysis',
        description: 'Emerging area with strong growth potential. Transit-oriented development opportunity.',
        parcel_id: 'parcel-6',
        address: '1234 Innovation Drive, Austin, TX 78701',
        apn: 'TRAVIS-2024-001',
        jurisdiction: 'Austin',
        zoning: 'MU-2',
        parcel_snapshot: {
          id: 'parcel-6',
          address: '1234 Innovation Drive, Austin, TX 78701',
          apn: 'TRAVIS-2024-001',
          jurisdiction: 'Austin',
          zoning: 'MU-2',
          lat: 30.2849,
          lng: -97.7341,
          sources: ['Assessor', 'County Records'],
          notes: 'Tech corridor proximity',
        },
        findings: {
          area_sqft: 125000,
          growth_potential: 'Very High',
          infrastructure: 'Highway access, utilities planned',
          demographics: 'Young, tech-savvy population',
        },
        tags: ['growth', 'tech-corridor', 'opportunity'],
        status: 'draft',
      },
    ];

    const { data: inserted, error: insertError } = await supabase
      .from('reports')
      .insert(reports)
      .select();

    if (insertError) {
      console.log('  ⚠️  Reports error:', insertError.message);
      if (insertError.code === 'PGRST205') {
        console.log('  ℹ️  Reports table does not exist yet.');
        console.log('  📋 You can manually run the SQL from: lib/db/migrations/create-all-mock-data.sql');
      }
    } else if (inserted) {
      console.log(`  ✅ Created ${inserted.length} reports`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Mock data seeding complete!');
    console.log('═'.repeat(60));
    console.log('\n📊 Summary:');
    console.log('  • Users: 3 test accounts');
    console.log('  • Teams: 3 organizations');
    console.log('  • Reports: 6 sample reports with full snapshots');
    console.log('\nNavigate to /dashboard/reports to view the data!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDatabase();
