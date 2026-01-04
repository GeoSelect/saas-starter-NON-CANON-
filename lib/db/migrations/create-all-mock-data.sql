-- ============================================================================
-- Complete Mock Data Setup for GeoSelect SaaS
-- Creates users, teams, and reports tables with sample data
-- ============================================================================

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Insert mock users
INSERT INTO users (name, email, password_hash, role)
VALUES
  ('John Developer', 'john@example.com', 'hashed_password_1', 'owner'),
  ('Jane Analyst', 'jane@example.com', 'hashed_password_2', 'member'),
  ('Bob Manager', 'bob@example.com', 'hashed_password_3', 'member')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Teams Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_product_id TEXT,
  plan_name VARCHAR(50),
  subscription_status VARCHAR(20)
);

-- Insert mock teams
INSERT INTO teams (name, plan_name, subscription_status)
VALUES
  ('Acme Real Estate', 'premium', 'active'),
  ('Global Development Corp', 'professional', 'active'),
  ('Tech Properties LLC', 'starter', 'trial')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Team Members Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert mock team members
INSERT INTO team_members (user_id, team_id, role)
VALUES
  (1, 1, 'owner'),
  (2, 1, 'member'),
  (3, 2, 'owner'),
  (2, 2, 'member')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Reports Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(64) PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  parcel_id VARCHAR(128) NOT NULL,
  address TEXT NOT NULL,
  apn VARCHAR(128),
  jurisdiction TEXT,
  zoning TEXT,
  parcel_snapshot JSONB NOT NULL,
  findings JSONB,
  tags JSONB DEFAULT '[]'::jsonb,
  share_token VARCHAR(64) UNIQUE,
  share_token_expires_at TIMESTAMP,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  snapshot_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Insert Mock Reports
-- ============================================================================
INSERT INTO reports (
  id, team_id, user_id, title, description, parcel_id, address, apn, 
  jurisdiction, zoning, parcel_snapshot, findings, tags, status
)
VALUES
  (
    'report-1',
    1,
    1,
    'Google HQ Zoning Analysis',
    'Initial zoning review for potential development. This property shows strong commercial viability with current C-2 zoning classification.',
    'parcel-1',
    '1600 Amphitheatre Parkway, Mountain View, CA 94043',
    '168-41-085',
    'Mountain View',
    'C-2',
    '{
      "id": "parcel-1",
      "address": "1600 Amphitheatre Parkway, Mountain View, CA 94043",
      "apn": "168-41-085",
      "jurisdiction": "Mountain View",
      "zoning": "C-2",
      "lat": 37.4224764,
      "lng": -122.0842499,
      "sources": ["Assessor", "Zoning"],
      "notes": "Google HQ - Mountain View Campus"
    }'::jsonb,
    '{
      "compatibility": "Commercial use verified",
      "restrictions": "Height limited to 75ft",
      "area_sqft": 65000,
      "assessment_value": "$2.8M"
    }'::jsonb,
    '["verified", "commercial", "priority"]'::jsonb,
    'published'
  ),
  (
    'report-2',
    1,
    2,
    'Apple Park Compliance Check',
    'Environmental compliance review and regulatory assessment. All findings indicate full compliance with state and local regulations.',
    'parcel-2',
    '1 Apple Park Way, Cupertino, CA 95014',
    '359-1-001',
    'Cupertino',
    'P(General)',
    '{
      "id": "parcel-2",
      "address": "1 Apple Park Way, Cupertino, CA 95014",
      "apn": "359-1-001",
      "jurisdiction": "Cupertino",
      "zoning": "P(General)",
      "lat": 37.3349285,
      "lng": -122.0090211,
      "sources": ["Assessor"],
      "notes": "Apple Park - Corporate Headquarters"
    }'::jsonb,
    '{
      "status": "Compliant",
      "environmental": "All requirements met",
      "wetlands": "None identified",
      "flood_zone": "Not in flood zone"
    }'::jsonb,
    '["compliant", "reviewed", "approved"]'::jsonb,
    'published'
  ),
  (
    'report-3',
    1,
    1,
    'Goldman Sachs Mixed Use Development',
    'Development potential assessment with phased implementation strategy.',
    'parcel-3',
    '101 Hudson Street, Jersey City, NJ 07302',
    'B03-P-011',
    'Jersey City',
    'Mixed Use',
    '{
      "id": "parcel-3",
      "address": "101 Hudson Street, Jersey City, NJ 07302",
      "apn": "B03-P-011",
      "jurisdiction": "Jersey City",
      "zoning": "Mixed Use",
      "lat": 40.7173162,
      "lng": -74.0113616,
      "sources": ["Assessor"],
      "notes": "Goldman Sachs Headquarters"
    }'::jsonb,
    '{
      "development_potential": "High",
      "recommendation": "Proceed with development application",
      "estimated_roi": "15-18%",
      "timeline": "24 months"
    }'::jsonb,
    '["high-potential", "development", "recommended"]'::jsonb,
    'published'
  ),
  (
    'report-4',
    2,
    3,
    'Grand Central Terminal Area Review',
    'Historic district considerations and zoning constraints analysis.',
    'parcel-4',
    '60 East 42nd Street, New York, NY 10165',
    'MN-2567-001',
    'New York',
    'C5-2',
    '{
      "id": "parcel-4",
      "address": "60 East 42nd Street, New York, NY 10165",
      "apn": "MN-2567-001",
      "jurisdiction": "New York",
      "zoning": "C5-2",
      "lat": 40.7527621,
      "lng": -73.9772471,
      "sources": ["Assessor", "Zoning"],
      "notes": "Grand Central Terminal area"
    }'::jsonb,
    '{
      "historic_district": true,
      "landmarks": "Yes - within historic district",
      "restrictions": "Strict facade requirements",
      "notes": "Requires LPC approval for any modifications"
    }'::jsonb,
    '["historic", "constrained", "requires-approval"]'::jsonb,
    'draft'
  ),
  (
    'report-5',
    2,
    3,
    'Manhattan Office Tower Assessment',
    'Premium office space utilization and market analysis.',
    'parcel-5',
    '650 Fifth Avenue, New York, NY 10019',
    'MN-1234-005',
    'New York',
    'C5-4',
    '{
      "id": "parcel-5",
      "address": "650 Fifth Avenue, New York, NY 10019",
      "apn": "MN-1234-005",
      "jurisdiction": "New York",
      "zoning": "C5-4",
      "lat": 40.7614,
      "lng": -73.9776,
      "sources": ["Assessor"],
      "notes": "Manhattan office tower"
    }'::jsonb,
    '{
      "property_type": "Office",
      "floor_area": 850000,
      "market_rent": "$75-85/sqft/year",
      "occupancy": "98%"
    }'::jsonb,
    '["office", "premium", "revenue-generating"]'::jsonb,
    'published'
  ),
  (
    'report-6',
    3,
    2,
    'Suburban Mixed Use Plot Analysis',
    'Emerging area with strong growth potential. Transit-oriented development opportunity.',
    'parcel-6',
    '1234 Innovation Drive, Austin, TX 78701',
    'TRAVIS-2024-001',
    'Austin',
    'MU-2',
    '{
      "id": "parcel-6",
      "address": "1234 Innovation Drive, Austin, TX 78701",
      "apn": "TRAVIS-2024-001",
      "jurisdiction": "Austin",
      "zoning": "MU-2",
      "lat": 30.2849,
      "lng": -97.7341,
      "sources": ["Assessor", "County Records"],
      "notes": "Tech corridor proximity"
    }'::jsonb,
    '{
      "area_sqft": 125000,
      "growth_potential": "Very High",
      "infrastructure": "Highway access, utilities planned",
      "demographics": "Young, tech-savvy population"
    }'::jsonb,
    '["growth", "tech-corridor", "opportunity"]'::jsonb,
    'draft'
  );

-- ============================================================================
-- Create Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_reports_team_id ON reports(team_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_share_token ON reports(share_token);
CREATE INDEX IF NOT EXISTS idx_reports_parcel_id ON reports(parcel_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- ============================================================================
-- Success Message
-- ============================================================================
-- All tables and mock data have been created successfully!
-- Users: 3 mock users created
-- Teams: 3 mock teams created
-- Team Members: 4 associations created
-- Reports: 6 sample reports created with full parcel snapshots
