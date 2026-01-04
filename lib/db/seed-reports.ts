import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import 'dotenv/config';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service role key:', serviceRoleKey ? '***' : 'NOT SET');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedReports() {
  try {
    // First, try to fetch any user and team. If they don't exist, we'll use defaults
    console.log('Checking for existing users and teams...');
    
    let userId = 1;
    let teamId = 1;

    // Try to get real user/team IDs
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .limit(1);

      if (!usersError && users && users.length > 0) {
        userId = users[0].id;
        console.log(`Found existing user ID: ${userId}`);
      }

      if (!teamsError && teams && teams.length > 0) {
        teamId = teams[0].id;
        console.log(`Found existing team ID: ${teamId}`);
      }
    } catch (e) {
      console.log('Could not fetch existing users/teams, using defaults (1, 1)');
    }

    console.log(`Seeding reports for user ${userId} in team ${teamId}...`);

    // Seed dummy reports
    const dummyParcelSnapshot = {
      id: 'parcel-1',
      address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
      apn: '168-41-085',
      jurisdiction: 'Mountain View',
      zoning: 'C-2',
      lat: 37.4224764,
      lng: -122.0842499,
      sources: ['Assessor', 'Zoning'],
      notes: 'Google HQ - Mountain View Campus',
    };

    const reports = [
      {
        id: 'report-1',
        team_id: teamId,
        user_id: userId,
        title: 'Google HQ Zoning Analysis',
        description: 'Initial zoning review for potential development',
        parcel_id: 'parcel-1',
        address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
        apn: '168-41-085',
        jurisdiction: 'Mountain View',
        zoning: 'C-2',
        parcel_snapshot: dummyParcelSnapshot,
        findings: { compatibility: 'Commercial use verified', restrictions: 'Height limited to 75ft' },
        tags: ['verified', 'commercial'],
        status: 'published',
      },
      {
        id: 'report-2',
        team_id: teamId,
        user_id: userId,
        title: 'Apple Park Compliance Check',
        description: 'Environmental compliance review',
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
        findings: { status: 'Compliant', notes: 'All environmental requirements met' },
        tags: ['compliant', 'reviewed'],
        status: 'draft',
      },
      {
        id: 'report-3',
        team_id: teamId,
        user_id: userId,
        title: 'Goldman Sachs Mixed Use Development',
        description: 'Development potential assessment',
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
        findings: { potential: 'High', recommendation: 'Proceed with development application' },
        tags: ['high-potential', 'development'],
        status: 'published',
      },
    ];

    // Insert reports - handle failures gracefully
    console.log(`Attempting to insert ${reports.length} reports...`);
    const { data: inserted, error: insertError } = await supabase
      .from('reports')
      .insert(reports as any)
      .select();

    if (insertError) {
      if (insertError.code === 'PGRST205') {
        console.error('Reports table does not exist yet. Creating via SQL...');
        // Try to create table first
        console.log('Tip: Create the reports table in Supabase dashboard, or run migrations');
      }
      console.error('Insert error:', insertError);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${inserted?.length || 0} test reports!`);
    console.log('Reports created:', inserted?.map(r => ({ id: r.id, title: r.title })));
  } catch (error) {
    console.error('Error seeding reports:', error);
    process.exit(1);
  }
}

seedReports();
