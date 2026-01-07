# Database Setup Guide (Supabase)

This guide explains how to set up your Supabase database for the SaaS Starter project.

## Quick Start

### 1. Environment Setup

Copy your Supabase credentials to `.env.local` (never commit):

```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get these from: https://supabase.com/dashboard/project/_/settings/api

### 2. Run Migrations

Choose one of these methods:

#### Option A: Supabase CLI (Recommended)

```bash
# Install CLI
npm install -g @supabase/cli

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase migration up
```

#### Option B: Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/_/sql
2. Create a new query
3. Copy SQL from: `supabase/migrations/001_initial_schema.sql`
4. Run the query
5. Repeat for each migration file

#### Option C: Direct Database Connection

```bash
# Get your database URL from:
# https://supabase.com/dashboard/project/_/settings/database

psql "postgresql://postgres.xxx:[password]@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require" \
  -f supabase/migrations/001_initial_schema.sql
```

#### Option D: Node.js Script

```bash
node scripts/migrate.js
```

### 3. Optional: Seed Development Data

```bash
supabase db seed
```

Or manually:
```bash
psql "postgresql://..." -f supabase/seeds/dev.sql
```

## Migration Files

Migrations are stored in: `supabase/migrations/`

Naming convention:
- `001_create_tables.sql`
- `002_add_indexes.sql`
- `003_create_functions.sql`
- etc.

**Important:** Each migration should be idempotent (use `IF NOT EXISTS`, etc.)

## Verification

After migrations, verify your tables:

1. **Dashboard Method:**
   - Go to: https://supabase.com/dashboard/project/_/editor
   - You should see all tables listed

2. **SQL Editor:**
   - Run: `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`

## Security Notes

### SERVICE_ROLE_KEY Protection

⚠️ **CRITICAL: Never expose SERVICE_ROLE_KEY to the client**

- ✓ Keep in `.env.local` (gitignored)
- ✓ Use only on server (API routes, server components, migrations)
- ✗ Never send to frontend
- ✗ Never log in error messages
- ✗ Never commit to git

### Environment Variable Files

```bash
# ✓ Gitignored (safe for secrets)
.env.local
.env.local.example
.env.*.local

# ✗ Committed (public values only)
.env.example
```

## Troubleshooting

### "Connection refused"

Check that your database URL is correct:
- Verify `SUPABASE_URL` format: `https://your-project.supabase.co`
- Check connection string from Dashboard

### "Permission denied"

Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` for migrations (admin privileges).

### Migration already applied

If a migration fails midway, check the migration history:

```sql
-- View applied migrations
SELECT * FROM schema_migrations;

-- Manually mark as applied (if needed)
INSERT INTO schema_migrations (version, name, state)
VALUES ('001', 'initial_schema', 'success');
```

## Next Steps

1. ✓ Run migrations
2. ✓ Seed test data (optional)
3. ✓ Start dev server: `pnpm dev`
4. ✓ Test at: http://localhost:3000

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Guide](https://supabase.com/docs/guides/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
