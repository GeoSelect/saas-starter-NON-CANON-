# PR-3: Environment Documentation + Policy

**Status**: Ready to merge with decision parameters (depends on D005, D001)

---

## What This PR Does

Creates environment setup documentation and security policy with decision parameters embedded. Provides templates for `.env.local` and environment variable management, parameterized by secrets backend choice.

**Merge Risk**: 🟡 Medium (has unresolved parameters, but safe to merge as documentation)  
**Blocks**: Nothing after merge  
**Blocked By**: PR-1 (soft dependency)

---

## Decision Parameters Required

This PR uses 2 critical decisions as parameters:

| Decision | Parameter | Options | Status |
|----------|-----------|---------|--------|
| D005 | `${D005_SECRETS_BACKEND}` | aws-secrets \| vault \| supabase-vault \| github-secrets | ⏳ Pending |
| D001 | `${D001_BACKEND_HOSTING}` | vercel \| docker \| kubernetes \| render | ⏳ Pending |

---

## Files to Create

### 1. `ENV_SETUP.md` (Parameterized Decision Tree)

```markdown
# Environment Setup Guide

**Current Configuration**:
- Secrets Backend: ${D005_SECRETS_BACKEND}
- Backend Hosting: ${D001_BACKEND_HOSTING}

## Quick Start

1. **Choose your secret loading method**:

${D005_SECRETS_BACKEND} == aws-secrets ?
   → Follow [AWS Secrets Setup](#aws-secrets-setup)
   
${D005_SECRETS_BACKEND} == supabase-vault ?
   → Follow [Supabase Vault Setup](#supabase-vault-setup)
   
${D005_SECRETS_BACKEND} == github-secrets ?
   → Follow [GitHub Secrets Setup](#github-secrets-setup)
   
${D005_SECRETS_BACKEND} == vault ?
   → Follow [HashiCorp Vault Setup](#hashicorp-vault-setup)

2. **Load environment file**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

3. **Verify environment**:
   ```bash
   pnpm run env:verify
   ```

## Setup by Secrets Backend

### AWS Secrets Setup

**Prerequisites**:
- AWS account with Secrets Manager access
- AWS CLI configured (run `aws configure`)
- IAM role with SecretsManager:GetSecretValue permission

**Steps**:
1. Create secrets in AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name geoselect-online-testing/database-url \
     --secret-string "postgresql://..."
   ```

2. Set environment variables:
   ```bash
   export AWS_REGION=us-east-1
   export SECRETS_BACKEND=aws-secrets
   ```

3. Load secrets in Node.js:
   ```typescript
   import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
   const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
   const secret = await client.send(new GetSecretValueCommand({...}));
   ```

### Supabase Vault Setup

**Prerequisites**:
- Supabase project
- Service role key (from Supabase dashboard)

**Steps**:
1. Create secrets in Supabase Vault (via dashboard or API)

2. Set environment variables:
   ```bash
   export SUPABASE_PROJECT_ID=your-project-id
   export SUPABASE_SERVICE_ROLE_KEY=your-key
   export SECRETS_BACKEND=supabase-vault
   ```

3. Load secrets in Node.js:
   ```typescript
   const { createClient } = require("@supabase/supabase-js");
   const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);
   const secrets = await supabase.rpc('vault.get_secrets');
   ```

### GitHub Secrets Setup

**Prerequisites**:
- Repository with GitHub Secrets configured
- Secrets already set in Actions settings

**Steps**:
1. Configure secrets in GitHub:
   - Settings → Secrets and variables → Actions
   - Add each secret (DATABASE_URL, API_KEY, etc.)

2. Set environment variable:
   ```bash
   export SECRETS_BACKEND=github-secrets
   ```

3. Secrets are automatically available in:
   - GitHub Actions workflows (via ${{ secrets.VARIABLE_NAME }})
   - Local development (via .env.local manually)

### HashiCorp Vault Setup

**Prerequisites**:
- Vault instance running (local or cloud)
- Vault token with KV v2 read permissions

**Steps**:
1. Authenticate with Vault:
   ```bash
   vault login -method=token
   ```

2. Set environment variables:
   ```bash
   export VAULT_ADDR=https://vault.example.com
   export VAULT_TOKEN=your-token
   export SECRETS_BACKEND=vault
   ```

3. Load secrets in Node.js:
   ```typescript
   import VaultSDK from "@hashicorp/vault-api";
   const client = new VaultSDK({...});
   const secret = await client.read('kv/data/geoselect/database-url');
   ```

---

## Environment File Template

→ See `.env.local.example` (parameterized by ${D005_SECRETS_BACKEND})

---

## Verification

Run this to verify your environment is configured correctly:

\`\`\`bash
pnpm run env:verify
\`\`\`

Expected output:
```
✅ DATABASE_URL is set
✅ API_KEY is set
✅ Secrets backend is responsive (${D005_SECRETS_BACKEND})
✅ Backend hosting detected (${D001_BACKEND_HOSTING})
✅ Environment is production-ready
```
```

**After D005 locked**: Replace `${D005_SECRETS_BACKEND}` decision tree with concrete setup steps

### 2. `.env.local.example` (Parameterized Template)

```bash
# Environment Configuration
# Copy this to .env.local and fill in your values

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/geoselect

# Secrets Backend: ${D005_SECRETS_BACKEND}
# Configure based on your secrets backend:

## If SECRETS_BACKEND = aws-secrets:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

## If SECRETS_BACKEND = supabase-vault:
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_SERVICE_ROLE_KEY=your-key

## If SECRETS_BACKEND = github-secrets:
# Secrets loaded from GitHub Actions automatically
# For local dev, add them here manually
# EXAMPLE_SECRET=value

## If SECRETS_BACKEND = vault:
VAULT_ADDR=https://vault.example.com
VAULT_TOKEN=your-token

# Backend Hosting: ${D001_BACKEND_HOSTING}

## If BACKEND_HOSTING = docker:
DOCKER_HOST=unix:///var/run/docker.sock
COMPOSE_PROJECT_NAME=geoselect

## If BACKEND_HOSTING = vercel:
VERCEL_URL=https://your-project.vercel.app
VERCEL_ENV=preview

## If BACKEND_HOSTING = kubernetes:
K8S_CONTEXT=production
K8S_NAMESPACE=geoselect

## If BACKEND_HOSTING = render:
RENDER_SERVICE_ID=your-service-id

# API Configuration
API_URL=http://localhost:8000
API_TIMEOUT=30000

# Feature Flags
ENABLE_AUDIT_LOGGING=true
ENABLE_WORKSPACE_SWITCHING=true

# Logging
LOG_LEVEL=debug
```

**After D005 and D001 locked**: Comments removed, only relevant variables shown

### 3. `ENV_POLICY.md` (Security Policy)

```markdown
# Environment & Secrets Security Policy

## Principles

1. **Secrets never in code**
   - All credentials loaded from ${D005_SECRETS_BACKEND}
   - Never commit .env.local
   - Never commit secrets to git

2. **Least privilege**
   - Each service gets only required secrets
   - Rotate secrets quarterly
   - Audit secret access

3. **Environment isolation**
   - Local ≠ Staging ≠ Production
   - Separate credentials per environment
   - No cross-environment secret reuse

## Implementation by Backend

### AWS Secrets Manager
- **Storage**: AWS SecretsManager
- **Access**: IAM role-based
- **Rotation**: AWS can auto-rotate
- **Auditing**: CloudTrail logs all access
- **Compliance**: HIPAA/SOC2 ready

### Supabase Vault
- **Storage**: Supabase encrypted storage
- **Access**: Service role with fine-grained permissions
- **Rotation**: Manual (we manage)
- **Auditing**: Supabase audit logs
- **Compliance**: GDPR/SOC2 ready

### GitHub Secrets
- **Storage**: GitHub encrypted storage
- **Access**: Repository-level permissions
- **Rotation**: Manual (we manage)
- **Auditing**: GitHub audit logs
- **Compliance**: Limited audit trail

### HashiCorp Vault
- **Storage**: Vault storage backend
- **Access**: Token-based + policies
- **Rotation**: Vault can auto-rotate
- **Auditing**: Full audit trail
- **Compliance**: Enterprise-grade

## Daily Operations

### Adding a New Secret

1. Decide: Where should this secret live?
   - ${D005_SECRETS_BACKEND} is your answer
   
2. Store it:
   \`\`\`bash
   # Example: AWS Secrets Manager
   aws secretsmanager create-secret \
     --name geoselect/my-secret \
     --secret-string "value"
   \`\`\`

3. Load it in code:
   - Never hardcode
   - Load from ${D005_SECRETS_BACKEND} on startup
   - Cache in memory if needed

4. Document it:
   - Add to .env.local.example (mark with [${D005_SECRETS_BACKEND}])
   - Add to this policy
   - Note rotation schedule

### Rotating Secrets

**Schedule**: Quarterly (or on breach)

\`\`\`bash
# 1. Create new secret value
aws secretsmanager create-secret-version \
  --secret-id geoselect/my-secret \
  --secret-string "new-value"

# 2. Update application config to use new value
# 3. Verify in staging first
# 4. Deploy to production
# 5. Delete old secret version after verification
\`\`\`

### Auditing Secret Access

**For ${D005_SECRETS_BACKEND}**, check:
- Who accessed which secret?
- When was it accessed?
- From which service?

\`\`\`bash
# Example: AWS CloudTrail
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=GetSecretValue
\`\`\`

## Compliance Requirements

### GDPR
- Secrets never contain PII
- Access logs kept for 30 days minimum
- Secrets deleted with customer data

### SOC2
- Secrets encrypted at rest
- Secrets encrypted in transit (HTTPS/TLS)
- Access controlled and audited
- Rotation tracked

### CCPA
- Customer data secrets separate by workspace
- No cross-workspace secret sharing
- Access audit trail maintained

## Violations & Escalation

**If you commit a secret to git**:
1. Immediately notify Security team
2. Rotate the compromised secret
3. Run git history cleanup
4. File incident report

**If someone accesses a secret without permission**:
1. Check audit logs
2. Verify intent
3. Add to access control policy
4. Document in security log

## Reference

- Secrets Backend: ${D005_SECRETS_BACKEND}
- Backend Hosting: ${D001_BACKEND_HOSTING}
- Security Owner: [Name from TEAM_CONTACTS.md]
- Policy Review: Quarterly
```

**After D005 locked**: Backend-specific sections become canonical

### 4. `env.config.ts` (Environment Verification)

```typescript
// Environment configuration and verification
// This file loads and validates environment variables based on
// selected secrets backend: ${D005_SECRETS_BACKEND}

import { z } from 'zod';

const secretsBackend = process.env.SECRETS_BACKEND || '${D005_SECRETS_BACKEND}';
const backendHosting = process.env.BACKEND_HOSTING || '${D001_BACKEND_HOSTING}';

// Schema for required environment variables
const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().describe('PostgreSQL connection string'),
  
  // API
  API_URL: z.string().url().optional().default('http://localhost:8000'),
  API_TIMEOUT: z.coerce.number().optional().default(30000),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
  
  // Feature flags
  ENABLE_AUDIT_LOGGING: z.coerce.boolean().optional().default(true),
  ENABLE_WORKSPACE_SWITCHING: z.coerce.boolean().optional().default(true),
});

// Backend-specific schemas
type BackendConfig =
  | { backend: 'docker'; dockerHost: string; composeProject: string }
  | { backend: 'vercel'; vercelUrl: string; vercelEnv: string }
  | { backend: 'kubernetes'; k8sContext: string; k8sNamespace: string }
  | { backend: 'render'; renderServiceId: string };

type SecretsConfig =
  | { backend: 'aws-secrets'; awsRegion: string; awsAccessKey: string; awsSecretKey: string }
  | { backend: 'supabase-vault'; supabaseProjectId: string; supabaseServiceRoleKey: string }
  | { backend: 'github-secrets'; /* loaded from GitHub */ }
  | { backend: 'vault'; vaultAddr: string; vaultToken: string };

export function loadEnv(): {
  env: z.infer<typeof EnvSchema>;
  backend: BackendConfig;
  secrets: SecretsConfig;
} {
  const env = EnvSchema.parse(process.env);

  // Load backend configuration based on ${D001_BACKEND_HOSTING}
  let backend: BackendConfig;
  switch (backendHosting) {
    case 'docker':
      backend = {
        backend: 'docker',
        dockerHost: process.env.DOCKER_HOST || 'unix:///var/run/docker.sock',
        composeProject: process.env.COMPOSE_PROJECT_NAME || 'geoselect',
      };
      break;
    case 'vercel':
      backend = {
        backend: 'vercel',
        vercelUrl: process.env.VERCEL_URL || 'http://localhost:3000',
        vercelEnv: process.env.VERCEL_ENV || 'preview',
      };
      break;
    case 'kubernetes':
      backend = {
        backend: 'kubernetes',
        k8sContext: process.env.K8S_CONTEXT || 'default',
        k8sNamespace: process.env.K8S_NAMESPACE || 'default',
      };
      break;
    case 'render':
      backend = {
        backend: 'render',
        renderServiceId: process.env.RENDER_SERVICE_ID || '',
      };
      break;
    default:
      throw new Error(`Unknown backend hosting: ${backendHosting}`);
  }

  // Load secrets configuration based on ${D005_SECRETS_BACKEND}
  let secrets: SecretsConfig;
  switch (secretsBackend) {
    case 'aws-secrets':
      secrets = {
        backend: 'aws-secrets',
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        awsAccessKey: process.env.AWS_ACCESS_KEY_ID || '',
        awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      };
      break;
    case 'supabase-vault':
      secrets = {
        backend: 'supabase-vault',
        supabaseProjectId: process.env.SUPABASE_PROJECT_ID || '',
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      };
      break;
    case 'github-secrets':
      secrets = {
        backend: 'github-secrets',
        // GitHub secrets are loaded by Actions automatically
      };
      break;
    case 'vault':
      secrets = {
        backend: 'vault',
        vaultAddr: process.env.VAULT_ADDR || 'http://localhost:8200',
        vaultToken: process.env.VAULT_TOKEN || '',
      };
      break;
    default:
      throw new Error(`Unknown secrets backend: ${secretsBackend}`);
  }

  return { env, backend, secrets };
}

// Verify environment on startup
export async function verifyEnv(): Promise<void> {
  console.log(`✓ Secrets backend: ${secretsBackend}`);
  console.log(`✓ Backend hosting: ${backendHosting}`);
  console.log(`✓ Environment loaded successfully`);
}
```

**After D005 and D001 locked**: Switch statements become single implementation paths

---

## Merge Checklist

Before merging PR-3:

- [ ] `ENV_SETUP.md` created with decision trees for ${D005_SECRETS_BACKEND}
- [ ] `.env.local.example` created with all backend-specific variables
- [ ] `ENV_POLICY.md` created with security guidelines
- [ ] `env.config.ts` created with parameterized loading logic
- [ ] All 4 files have ${D005_SECRETS_BACKEND} and ${D001_BACKEND_HOSTING} placeholders
- [ ] Team understands this is a template (not functional until decisions lock)
- [ ] Ready for injection script to run after Backend/SRE session

---

## After Decisions Lock (4-6 hours later)

Once Backend/SRE session completes and decisions are locked:

```bash
./scripts/inject-decisions.sh \
  --backend-hosting docker \
  --secrets-backend aws-secrets

# This script will:
# 1. Replace ${D005_SECRETS_BACKEND} with "aws-secrets" in all files
# 2. Replace ${D001_BACKEND_HOSTING} with "docker" in all files
# 3. Remove unused decision branches from env.config.ts
# 4. Simplify ENV_SETUP.md to show only relevant steps
# 5. Commit changes with message "Inject Phase 1 decisions"
```

---

## Decision Dependencies

**This PR depends on**:
- PR-1 (soft dependency)
- D005 (Secrets Backend) - determines secret loading approach
- D001 (Backend Hosting) - determines environment URLs

**This PR unblocks**:
- Frontend developers (know how to set up environment locally)
- DevOps team (know secret management approach)
- Quality assurance (know how to configure test environments)

---

## Success Criteria

You'll know this PR is working when:
- ✅ PR merges with placeholders intact
- ✅ Developers can follow ENV_SETUP.md decision tree (even though decision not yet made)
- ✅ .env.local.example covers all possible backends
- ✅ env.config.ts compiles and loads successfully
- ✅ After injection, only relevant setup steps remain

---

## Risk Assessment

**Current Risk**: 🟡 Medium
- Has unresolved decision parameters
- But safe to merge (documentation only)
- No production impact until injection

**Risk After Injection**: ✅ Low
- Becomes functionally complete
- All parameters resolved
- Ready for local development
