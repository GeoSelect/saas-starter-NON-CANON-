# PR-4: Seed Script Scaffolding

**Status**: Ready to merge with decision parameters (depends on D001, D020, D005)

---

## What This PR Does

Creates database seed script scaffold with decision parameters embedded. Once Backend/SRE locks decisions, parameters are injected and seed script becomes fully functional.

**Merge Risk**: 🟡 Medium (has unresolved parameters, but safe to merge as template)  
**Blocks**: Nothing after merge  
**Blocked By**: PR-1 (soft dependency)

---

## Decision Parameters Required

This PR uses 3 critical decisions as parameters:

| Decision | Parameter | Options | Status |
|----------|-----------|---------|--------|
| D001 | `${D001_BACKEND_HOSTING}` | vercel \| docker \| kubernetes \| render | ⏳ Pending |
| D020 | `${D020_SEED_STRATEGY}` | sql-script \| orm-migrations \| managed-service \| snapshot | ⏳ Pending |
| D005 | `${D005_SECRETS_BACKEND}` | aws-secrets \| vault \| supabase-vault \| github-secrets | ⏳ Pending |

---

## Files to Create

### 1. `scripts/seed.ts` (Parameterized Main Seed Script)

```typescript
#!/usr/bin/env node

/**
 * Database Seed Script
 * 
 * Seed strategy: ${D020_SEED_STRATEGY}
 * Backend hosting: ${D001_BACKEND_HOSTING}
 * Secrets backend: ${D005_SECRETS_BACKEND}
 * 
 * This script populates the database with initial/test data.
 * Implementation changes based on D020_SEED_STRATEGY selection.
 */

import { loadEnv } from '../env.config';
import { seedDatabase } from './seeds/index';

const seedStrategy = process.env.SEED_STRATEGY || '${D020_SEED_STRATEGY}';
const backendHosting = process.env.BACKEND_HOSTING || '${D001_BACKEND_HOSTING}';
const secretsBackend = process.env.SECRETS_BACKEND || '${D005_SECRETS_BACKEND}';

async function main() {
  try {
    console.log(`🌱 Database Seed Script`);
    console.log(`   Strategy: ${seedStrategy}`);
    console.log(`   Hosting: ${backendHosting}`);
    console.log(`   Secrets: ${secretsBackend}`);

    // Load environment configuration
    const { env, backend, secrets } = loadEnv();
    
    // Connect to database based on strategy
    if (seedStrategy === 'sql-script') {
      await seedWithSQL(env.DATABASE_URL, secrets);
    } else if (seedStrategy === 'orm-migrations') {
      await seedWithORM(env.DATABASE_URL, secrets);
    } else if (seedStrategy === 'managed-service') {
      await seedWithManagedService(env.DATABASE_URL, secrets);
    } else if (seedStrategy === 'snapshot') {
      await seedWithSnapshot(env.DATABASE_URL, secrets);
    } else {
      throw new Error(`Unknown seed strategy: ${seedStrategy}`);
    }

    console.log(`✅ Database seeded successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed:`, error);
    process.exit(1);
  }
}

/**
 * SQL Script Strategy
 * Best for: Simple, fast seeding with raw SQL
 */
async function seedWithSQL(
  databaseUrl: string,
  secrets: SecretsConfig
): Promise<void> {
  // Implementation depends on D020 decision
  // This is a placeholder - will be replaced with actual SQL seed on decision lock
  
  console.log(`📝 Using SQL script seeding strategy...`);
  console.log(`   This will run scripts/seed.sql`);
  
  // After D020 = sql-script decision:
  // const client = new Client({ connectionString: databaseUrl });
  // await client.connect();
  // const sql = fs.readFileSync('./scripts/seed.sql', 'utf-8');
  // await client.query(sql);
  // await client.end();
}

/**
 * ORM Migrations Strategy
 * Best for: Structured seeding with TypeORM/Prisma
 */
async function seedWithORM(
  databaseUrl: string,
  secrets: SecretsConfig
): Promise<void> {
  // Implementation depends on D020 decision
  // This is a placeholder - will be replaced with actual ORM seed on decision lock
  
  console.log(`🔄 Using ORM migrations seeding strategy...`);
  console.log(`   This will run database migrations and seeds`);
  
  // After D020 = orm-migrations decision:
  // const dataSource = new DataSource({...});
  // await dataSource.initialize();
  // await dataSource.runMigrations();
  // await dataSource.end();
}

/**
 * Managed Service Strategy
 * Best for: Supabase/Firebase managed seeding
 */
async function seedWithManagedService(
  databaseUrl: string,
  secrets: SecretsConfig
): Promise<void> {
  // Implementation depends on D020 decision
  // This is a placeholder - will be replaced with managed service seed on decision lock
  
  console.log(`☁️  Using managed service seeding strategy...`);
  console.log(`   This will use Supabase/Firebase seeding API`);
  
  // After D020 = managed-service decision:
  // const { createClient } = require('@supabase/supabase-js');
  // const supabase = createClient(projectUrl, serviceRoleKey);
  // await supabase.from('table').insert([...]);
}

/**
 * Snapshot Strategy
 * Best for: Complex seeding from production snapshot
 */
async function seedWithSnapshot(
  databaseUrl: string,
  secrets: SecretsConfig
): Promise<void> {
  // Implementation depends on D020 decision
  // This is a placeholder - will be replaced with snapshot seed on decision lock
  
  console.log(`📦 Using snapshot seeding strategy...`);
  console.log(`   This will restore from backup snapshot`);
  
  // After D020 = snapshot decision:
  // const snapshot = fs.readFileSync('./backups/seed-snapshot.sql', 'utf-8');
  // const client = new Client({ connectionString: databaseUrl });
  // await client.connect();
  // await client.query(snapshot);
  // await client.end();
}

// Run main
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**After D020, D001, D005 locked**: Choose one implementation path

### 2. `scripts/seed.sql` (SQL Seed Data - if D020 = sql-script)

```sql
-- Database Seed Script (SQL)
-- Strategy: ${D020_SEED_STRATEGY}
-- Use this file if SEED_STRATEGY = 'sql-script'

-- This is a placeholder. After D020 decision, populate with:
-- - Workspace templates
-- - User roles and permissions
-- - Initial audit log entries
-- - Feature flag defaults
-- - Reference data

-- Example structure (will be implemented post-decision):
-- 1. Insert workspace templates (geoselect-default, geoselect-enterprise, etc.)
-- 2. Insert user roles (admin, editor, viewer)
-- 3. Insert workspace membership templates
-- 4. Insert initial audit events
-- 5. Insert compliance policies

BEGIN;

-- Placeholder: Workspace templates
-- INSERT INTO workspaces (id, name, type) VALUES
--   ('ws-default', 'Default Workspace', 'standard'),
--   ('ws-enterprise', 'Enterprise Template', 'enterprise');

-- Placeholder: User roles
-- INSERT INTO roles (id, name, permissions) VALUES
--   ('role-admin', 'Administrator', '{...}'),
--   ('role-editor', 'Editor', '{...}'),
--   ('role-viewer', 'Viewer', '{...}');

-- Placeholder: Workspace membership
-- INSERT INTO workspace_members (workspace_id, user_id, role_id) VALUES
--   ('ws-default', 'user-admin', 'role-admin');

-- Placeholder: Initial audit events
-- INSERT INTO audit_events (workspace_id, user_id, event_type, data) VALUES
--   ('ws-default', 'system', 'WORKSPACE_CREATED', '{"name":"Default Workspace"}');

COMMIT;
```

**After D020 decision (if sql-script selected)**: Replace placeholders with actual seed data

### 3. `scripts/seeds/index.ts` (Seed Data Loaders)

```typescript
/**
 * Seed Data Loaders
 * 
 * These loaders populate initial/test data.
 * Implementation varies by SEED_STRATEGY: ${D020_SEED_STRATEGY}
 */

import { SecretsConfig } from '../env.config';

export interface SeedData {
  workspaces: WorkspaceSeed[];
  users: UserSeed[];
  memberships: MembershipSeed[];
  auditEvents: AuditEventSeed[];
}

export interface WorkspaceSeed {
  id: string;
  name: string;
  type: 'standard' | 'enterprise' | 'testing';
  createdAt: Date;
}

export interface UserSeed {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface MembershipSeed {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

export interface AuditEventSeed {
  workspaceId: string;
  userId: string;
  eventType: string;
  data: Record<string, unknown>;
}

/**
 * Load default seed data
 * Implementation depends on SEED_STRATEGY selection
 */
export async function seedDatabase(
  databaseUrl: string,
  secrets: SecretsConfig
): Promise<SeedData> {
  // This is a placeholder - will be replaced with actual data loaders
  
  console.log(`📊 Loading seed data with strategy: ${process.env.SEED_STRATEGY}`);
  
  // Return placeholder data structure
  return {
    workspaces: [
      {
        id: 'ws-testing',
        name: 'Testing Workspace',
        type: 'testing',
        createdAt: new Date(),
      },
    ],
    users: [
      {
        id: 'user-tester',
        email: 'tester@geoselect.com',
        name: 'Test User',
        role: 'admin',
      },
    ],
    memberships: [
      {
        workspaceId: 'ws-testing',
        userId: 'user-tester',
        role: 'owner',
      },
    ],
    auditEvents: [
      {
        workspaceId: 'ws-testing',
        userId: 'system',
        eventType: 'WORKSPACE_CREATED',
        data: { name: 'Testing Workspace' },
      },
    ],
  };
}

// After D020 decision (if orm-migrations):
export async function loadViaORM(databaseUrl: string) {
  // Migrate and seed using TypeORM/Prisma
}

// After D020 decision (if managed-service):
export async function loadViaManagedService(secrets: SecretsConfig) {
  // Load via Supabase/Firebase API
}

// After D020 decision (if snapshot):
export async function loadViaSnapshot(databaseUrl: string) {
  // Restore from backup snapshot
}
```

**After D020 decision**: Implement loaders for selected strategy

### 4. `scripts/seed-env-detector.ts` (Environment Detection)

```typescript
/**
 * Environment Detection Script
 * Automatically detect environment and use correct seed strategy
 * 
 * Backend hosting: ${D001_BACKEND_HOSTING}
 * Seed strategy: ${D020_SEED_STRATEGY}
 */

import { loadEnv } from '../env.config';

export async function detectAndSeed(): Promise<void> {
  const { env, backend, secrets } = loadEnv();
  
  const backendHosting = process.env.BACKEND_HOSTING || '${D001_BACKEND_HOSTING}';
  const seedStrategy = process.env.SEED_STRATEGY || '${D020_SEED_STRATEGY}';
  
  console.log(`🔍 Detecting environment...`);
  console.log(`   Backend: ${backendHosting}`);
  console.log(`   Strategy: ${seedStrategy}`);
  
  // Detect database availability based on backend
  switch (backendHosting) {
    case 'docker':
      console.log(`   Found Docker environment - using local DB`);
      // Use local PostgreSQL from docker-compose
      break;
    case 'vercel':
      console.log(`   Found Vercel environment - using Vercel Postgres`);
      // Use Vercel Postgres
      break;
    case 'kubernetes':
      console.log(`   Found Kubernetes environment - using K8s DB service`);
      // Use K8s database service
      break;
    case 'render':
      console.log(`   Found Render environment - using Render managed DB`);
      // Use Render managed database
      break;
  }
  
  // Seed using selected strategy
  // Implementation varies by D020_SEED_STRATEGY selection
}

// Run detection
detectAndSeed().catch((error) => {
  console.error('Detection failed:', error);
  process.exit(1);
});
```

**After D001 locked**: Backend-specific database detection becomes concrete

### 5. `package.json` Scripts Section

```json
{
  "scripts": {
    "seed": "tsx scripts/seed.ts",
    "seed:local": "BACKEND_HOSTING=docker SEED_STRATEGY=${D020_SEED_STRATEGY} pnpm seed",
    "seed:staging": "BACKEND_HOSTING=${D001_BACKEND_HOSTING} SEED_STRATEGY=${D020_SEED_STRATEGY} pnpm seed",
    "seed:verify": "tsx scripts/seed-env-detector.ts",
    "db:reset": "pnpm seed",
    "db:setup": "pnpm seed && pnpm seed:verify"
  }
}
```

**After D001, D020 locked**: Remove placeholders from seed scripts

### 6. `Dockerfile.seed` (Containerized Seed - if D001 = docker)

```dockerfile
# Seed Job Dockerfile
# Used if BACKEND_HOSTING = docker
# Runs seed script in isolated container

FROM node:20-alpine

WORKDIR /app

# Copy seed scripts
COPY scripts/ ./scripts/
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Environment will be injected at runtime
# ${D001_BACKEND_HOSTING}, ${D020_SEED_STRATEGY}, ${D005_SECRETS_BACKEND}

ENV BACKEND_HOSTING=${D001_BACKEND_HOSTING}
ENV SEED_STRATEGY=${D020_SEED_STRATEGY}
ENV SECRETS_BACKEND=${D005_SECRETS_BACKEND}

# Run seed on container startup
CMD ["pnpm", "seed"]
```

**After D001 decision (if docker selected)**: Make concrete

---

## Merge Checklist

Before merging PR-4:

- [ ] `scripts/seed.ts` created with decision tree for ${D020_SEED_STRATEGY}
- [ ] `scripts/seed.sql` created (placeholder, to be populated post-decision)
- [ ] `scripts/seeds/index.ts` created with data loader interfaces
- [ ] `scripts/seed-env-detector.ts` created with backend detection logic
- [ ] `package.json` updated with seed scripts (parameterized)
- [ ] `Dockerfile.seed` created (for docker backend option)
- [ ] All 3 parameters have placeholders: ${D001_BACKEND_HOSTING}, ${D020_SEED_STRATEGY}, ${D005_SECRETS_BACKEND}
- [ ] Team understands this is a template (not functional until decisions lock)
- [ ] Ready for injection script to run after Backend/SRE session

---

## After Decisions Lock (4-6 hours later)

Once Backend/SRE session completes and decisions are locked:

```bash
./scripts/inject-decisions.sh \
  --backend-hosting docker \
  --seed-strategy sql-script \
  --secrets-backend aws-secrets

# This script will:
# 1. Replace ${D001_BACKEND_HOSTING} with "docker"
# 2. Replace ${D020_SEED_STRATEGY} with "sql-script"
# 3. Replace ${D005_SECRETS_BACKEND} with "aws-secrets"
# 4. Remove unused seed strategy branches
# 5. Populate scripts/seed.sql with actual seed data
# 6. Remove unused function implementations
# 7. Commit changes with message "Inject Phase 1 decisions"
```

---

## Running the Seed Script

### Pre-Decision (Template)
```bash
# After merge but before decision lock
pnpm seed
# Output: Displays decision tree, doesn't actually seed
# Result: Error showing which decisions must be made first
```

### Post-Decision (Functional)
```bash
# After Backend/SRE decisions lock and injection runs
pnpm seed
# Output: Seeds database with selected strategy
# Result: Database populated with initial data
```

### Local Development
```bash
# Run seed in Docker environment (fastest)
pnpm seed:local
# Uses: docker postgres, sql-script strategy, default secrets

# Run with verification
pnpm db:setup
# Runs seed, then verifies environment
```

### CI/CD
```bash
# In GitHub Actions (post-injection)
# .github/workflows/deploy.yml includes:
# - Build: docker build -f Dockerfile.seed
# - Push: to ${D002_DOCKER_REGISTRY}
# - Run: docker-compose exec seed pnpm seed
```

---

## Decision Dependencies

**This PR depends on**:
- PR-1 (soft dependency)
- D001 (Backend Hosting) - determines database access method
- D020 (Seed Strategy) - determines implementation approach
- D005 (Secrets Backend) - determines secret loading for seed data

**This PR unblocks**:
- Database initialization automation
- CI/CD seed jobs (once decisions lock)
- Local development onboarding
- Integration testing setup

---

## Success Criteria

You'll know this PR is working when:
- ✅ PR merges with placeholders intact
- ✅ `pnpm seed` runs without errors (shows decision tree)
- ✅ All seed strategy branches are syntactically valid
- ✅ After injection, `pnpm seed` actually populates database
- ✅ Seed job runs successfully in CI/CD pipeline

---

## Risk Assessment

**Current Risk**: 🟡 Medium
- Has unresolved decision parameters
- But safe to merge (template only)
- No database mutations until decisions lock

**Risk After Injection**: ✅ Low
- Becomes fully functional
- All parameters resolved
- Ready for production seeding

---

## Troubleshooting

### Pre-Decision Issues
- **Error**: "Unknown seed strategy: undefined"
  - **Cause**: D020_SEED_STRATEGY not yet decided
  - **Fix**: Wait for Backend/SRE session to lock decisions

- **Error**: "Cannot connect to database"
  - **Cause**: D001_BACKEND_HOSTING not yet configured
  - **Fix**: Wait for Backend/SRE session to lock decisions

### Post-Decision Issues
- **Error**: "Seed script failed with SQL syntax error"
  - **Cause**: scripts/seed.sql has invalid SQL
  - **Fix**: Review injected SQL, verify against schema

- **Error**: "Cannot load secrets from ${D005_SECRETS_BACKEND}"
  - **Cause**: Secrets backend not properly configured
  - **Fix**: Verify SECRETS_BACKEND environment variable is correct

---

## Timeline

| Phase | Duration | Action | Blocker |
|-------|----------|--------|---------|
| **Merge PR-4** | 0 min | Merge with placeholders | None |
| **Backend/SRE Session** | 2.5 hrs | Lock D001, D020, D005 | PR-1 merged |
| **Injection** | 15 min | Replace parameters | Decisions locked |
| **Test Seed** | 5 min | Run `pnpm seed` | Injection complete |
| **Production Ready** | 0 min | Use in CI/CD | Test successful |
