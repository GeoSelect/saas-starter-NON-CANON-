CREATE TABLE IF NOT EXISTS "reports" (
  "id" varchar(64) PRIMARY KEY,
  "account_id" varchar(128),
  "title" varchar(255) NOT NULL,
  "parcel_id" varchar(128) NOT NULL,
  "address" text,
  "jurisdiction" text,
  "status" varchar(32) NOT NULL DEFAULT 'ready',
  "projection" jsonb,
  "branding" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "reports_parcel_idx" ON "reports" ("parcel_id");
CREATE INDEX IF NOT EXISTS "reports_account_idx" ON "reports" ("account_id");
