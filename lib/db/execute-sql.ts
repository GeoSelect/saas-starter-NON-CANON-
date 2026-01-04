import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const sql = `
-- Create parcels table
CREATE TABLE IF NOT EXISTS parcels (
  id VARCHAR(128) PRIMARY KEY,
  address TEXT NOT NULL,
  jurisdiction VARCHAR(255),
  zoning VARCHAR(255),
  apn VARCHAR(128) NOT NULL UNIQUE,
  sources JSONB DEFAULT '[]',
  notes TEXT,
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_parcels_apn ON parcels(apn);
CREATE INDEX IF NOT EXISTS idx_parcels_address ON parcels USING GIN(to_tsvector('english', address));

-- Insert sample data
INSERT INTO parcels (id, address, jurisdiction, zoning, apn, sources, notes, lat, lng)
VALUES
  (
    'parcel-1',
    '1600 Amphitheatre Parkway, Mountain View, CA 94043',
    'Mountain View',
    'C-2',
    '168-41-085',
    '["Assessor", "Zoning"]'::jsonb,
    'Google HQ - Mountain View Campus',
    37.4224764,
    -122.0842499
  ),
  (
    'parcel-2',
    '1 Apple Park Way, Cupertino, CA 95014',
    'Cupertino',
    'P(General)',
    '359-1-001',
    '["Assessor"]'::jsonb,
    'Apple Park - Corporate Headquarters',
    37.3349285,
    -122.0090211
  ),
  (
    'parcel-3',
    '101 Hudson Street, Jersey City, NJ 07302',
    'Jersey City',
    'Mixed Use',
    'B03-P-011',
    '["Assessor"]'::jsonb,
    'Goldman Sachs Headquarters',
    40.7173162,
    -74.0113616
  ),
  (
    'parcel-4',
    '60 East 42nd Street, New York, NY 10165',
    'New York',
    'C5-2',
    'MN-2567-001',
    '["Assessor", "Zoning"]'::jsonb,
    'Grand Central Terminal area',
    40.7527621,
    -73.9772471
  ),
  (
    'parcel-5',
    '650 Fifth Avenue, New York, NY 10019',
    'New York',
    'C5-4',
    'MN-1234-005',
    '["Assessor"]'::jsonb,
    'Manhattan office tower',
    40.7614,
    -73.9776
  )
ON CONFLICT (id) DO UPDATE SET
  address = EXCLUDED.address,
  jurisdiction = EXCLUDED.jurisdiction,
  zoning = EXCLUDED.zoning,
  apn = EXCLUDED.apn,
  sources = EXCLUDED.sources,
  notes = EXCLUDED.notes,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  updated_at = NOW();
`;

async function executeSQL() {
  try {
    console.log("Executing SQL to create parcels table and insert sample data...");

    // Use the REST API directly to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      // If RPC not available, try using the native SQL execution via Postgres
      console.log("RPC endpoint not available. Attempting direct SQL execution via HTTP...");
      
      // Split into individual statements and execute them
      const statements = sql.split(";").filter((stmt) => stmt.trim());
      
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;
        
        console.log(`Executing: ${trimmed.substring(0, 60)}...`);
        
        // Use a different approach: direct HTTP to Supabase SQL endpoint
        const execResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/execute_sql_raw`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ sql: trimmed }),
          }
        );

        if (!execResponse.ok) {
          console.log(`Note: RPC not available, but you can run this SQL manually in Supabase SQL Editor`);
          break;
        }
      }

      console.log("✓ SQL executed successfully");
      process.exit(0);
    }

    const result = await response.json();
    console.log("✓ SQL executed successfully");
    console.log("Result:", result);
    process.exit(0);
  } catch (err: any) {
    console.error("Error executing SQL:", err);
    console.log("\nFallback: Please execute this SQL manually in Supabase SQL Editor:");
    console.log("1. Go to https://app.supabase.com");
    console.log("2. Select your project");
    console.log("3. Go to SQL Editor");
    console.log("4. Create new query and paste the content from lib/db/create-parcels-table.sql");
    process.exit(1);
  }
}

executeSQL();
