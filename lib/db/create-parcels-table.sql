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
