-- Create reports table for CCP-04 & CCP-05 (Immutable snapshots of parcel intelligence)
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_team_id ON reports(team_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_share_token ON reports(share_token);
