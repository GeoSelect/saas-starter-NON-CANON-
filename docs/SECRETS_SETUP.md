# Secrets Management Guide

This guide provides comprehensive instructions for managing secrets and environment variables in this SaaS starter application, covering both local development and GitHub Actions CI/CD workflows.

## Table of Contents

- [Section A: Local Development Setup](#section-a-local-development-setup)
- [Section B: GitHub Organization Secrets Setup](#section-b-github-organization-secrets-setup)
- [Section C: Required Organization Secrets List](#section-c-required-organization-secrets-list)
- [Section D: Security Best Practices](#section-d-security-best-practices)

---

## Section A: Local Development Setup

### Prerequisites

Before setting up your environment, ensure you have accounts with:

- **Supabase** - Database and authentication ([supabase.com](https://supabase.com))
- **Stripe** - Payment processing ([stripe.com](https://stripe.com))
- **DigitalOcean** (Optional) - For backend deployment ([digitalocean.com](https://digitalocean.com))
- **GitHub** - For repository access and OAuth ([github.com](https://github.com))
- **Docker Hub or Container Registry** (Optional) - For Docker image hosting

### Step 1: Copy Environment Template

The repository includes `.env.example` with all required environment variables. Copy it to create your local environment file:

```bash
# Copy the template
cp .env.example .env.local

# Or if you prefer .env (note: some tools expect .env.local for Next.js)
cp .env.example .env
```

> **Note**: `.env.local` is recommended for Next.js projects as it takes precedence over `.env` and is automatically git-ignored.

### Step 2: Configure Each Secret

Open `.env.local` in your editor and fill in the actual values. Here's where to get each credential:

#### Database Configuration

```bash
POSTGRES_URL=postgresql://username:password@localhost:5432/database_name
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

**Where to get it:**
- **Local Development**: After running `pnpm db:setup`, the script will provide the connection string
- **Supabase**: Go to your project → Settings → Database → Connection string
- **DigitalOcean**: Database dashboard → Connection Details

#### Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get it:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use for `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

> **⚠️ CRITICAL SECURITY WARNING**: The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges and bypasses Row Level Security. NEVER expose it to the client side or commit it to git.

#### Authentication & Security

```bash
AUTH_SECRET=your-super-secret-auth-key-here
JWT_SECRET=your-jwt-secret-key-here
API_SECRET_KEY=your-api-secret-key-here
```

**How to generate:**
```bash
# Generate a secure random secret (32 bytes, base64-encoded)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run the command three times to generate three different secrets for `AUTH_SECRET`, `JWT_SECRET`, and `API_SECRET_KEY`.

#### Stripe Configuration

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

**Where to get it:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy the **Secret key** (use test key for development)
4. For webhook secret:
   - Navigate to **Developers** → **Webhooks**
   - Click **Add endpoint** or use Stripe CLI for local testing
   - Copy the **Signing secret**

**Local webhook testing with Stripe CLI:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# The CLI will output a webhook signing secret - use this for STRIPE_WEBHOOK_SECRET
```

#### Next.js Application URLs

```bash
BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For local development**, use `http://localhost:3000`. For production, replace with your actual domain.

#### DigitalOcean Configuration (Optional)

```bash
DIGITALOCEAN_ACCESS_TOKEN=dop_v1_your_digitalocean_token_here
DO_APP_NAME=your-app-name
```

**Where to get it:**
1. Log in to [DigitalOcean](https://cloud.digitalocean.com)
2. Navigate to **API** → **Tokens/Keys**
3. Click **Generate New Token**
4. Set permissions (read + write for deployments)
5. Copy the token immediately (it's only shown once)

#### Docker Registry (Optional)

```bash
DOCKER_REGISTRY_URL=registry.hub.docker.com
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password-or-token
```

**Where to get it:**

**For Docker Hub:**
1. Go to [Docker Hub](https://hub.docker.com)
2. Navigate to **Account Settings** → **Security**
3. Click **New Access Token**
4. Copy the token to use as `DOCKER_PASSWORD`

**For DigitalOcean Container Registry:**
```bash
DOCKER_REGISTRY_URL=registry.digitalocean.com/your-registry-name
```
Use your DigitalOcean API token for `DOCKER_PASSWORD`.

**For GitHub Container Registry:**
```bash
DOCKER_REGISTRY_URL=ghcr.io/your-org
DOCKER_USERNAME=your-github-username
DOCKER_PASSWORD=your-github-personal-access-token
```

#### GitHub OAuth (Optional)

```bash
GITHUB_TOKEN=ghp_your_github_personal_access_token_here
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

**Where to get it:**

**Personal Access Token:**
1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click **Generate new token** → **Generate new token (classic)**
3. Select required scopes (repo, workflow, etc.)
4. Copy the token

**OAuth App (for GitHub sign-in):**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details:
   - **Homepage URL**: `http://localhost:3000` (development) or your production URL
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and generate a **Client Secret**

#### Google Maps (Optional)

For Google Maps configuration, see `.env.local.example` for detailed setup instructions.

### Step 3: Verify Environment Setup

After configuring your environment file, verify that the application can load the variables:

```bash
# Start the development server
pnpm dev

# The server should start without errors
# Check the console for any missing environment variable warnings
```

### VS Code Settings for Secure Environment Variable Handling

Create a `.vscode/settings.json` file in your project (this file is git-ignored) to configure VS Code for secure environment variable handling:

```json
{
  "files.exclude": {
    "**/.env.local": false,
    "**/.env": false
  },
  "files.watcherExclude": {
    "**/.env.local": true,
    "**/.env": true
  },
  "search.exclude": {
    "**/.env.local": true,
    "**/.env": true
  },
  "dotenv.enableAutocloaking": false,
  "[dotenv]": {
    "editor.defaultFormatter": "foxundermoon.shell-format"
  }
}
```

**Recommended VS Code Extensions:**

Install the DotENV extension for syntax highlighting:
- **DotENV**: `ms-vscode.dotenv` - Syntax highlighting for .env files
- **Postman**: `Postman.postman-for-vscode` - For API testing with environment variables

These are also listed in `.vscode/extensions.json`.

---

## Section B: GitHub Organization Secrets Setup

GitHub Actions workflows can access secrets defined at the organization level, making it easy to share secrets across multiple repositories without duplicating them.

### Why Organization Secrets?

- **Centralized Management**: Define secrets once, use across multiple repositories
- **Consistency**: All repositories use the same credentials for shared services
- **Easier Rotation**: Update in one place when rotating credentials
- **Access Control**: Fine-grained control over which repositories can access each secret

### Method 1: GitHub Web UI (Recommended for Beginners)

This is the easiest method for setting up organization secrets.

#### Step-by-Step Instructions

1. **Navigate to Organization Settings**
   - Go to `https://github.com/organizations/geoselect-it/settings/secrets/actions`
   - Or: GitHub → Your profile → Organizations → `geoselect-it` → Settings → Secrets and variables → Actions

2. **Add a New Secret**
   - Click the **New organization secret** button
   - Enter the secret details:
     - **Name**: Enter the secret name (e.g., `SUPABASE_URL`)
     - **Secret**: Paste the secret value
     - **Repository access**: Choose access level:
       - **All repositories**: Secret available to all current and future repos
       - **Private repositories**: Only private repos can access
       - **Selected repositories**: Choose specific repos that need access

3. **Configure Repository Access**
   
   For this SaaS starter and related repositories, you typically want:
   - **Production secrets**: Selected repositories (only production repos)
   - **Shared service secrets** (Supabase, DigitalOcean): All repositories or private repositories
   - **Development secrets**: Can be repository-specific (not organization-level)

4. **Save the Secret**
   - Click **Add secret**
   - The secret is now available to your configured repositories

5. **Repeat for Each Required Secret**
   - See [Section C](#section-c-required-organization-secrets-list) for the complete list

### Method 2: GitHub CLI (Recommended for Automation)

The GitHub CLI is perfect for scripting secret setup or quickly updating multiple secrets.

#### Prerequisites

Install GitHub CLI:
```bash
# macOS
brew install gh

# Windows
winget install --id GitHub.cli

# Linux
# See https://github.com/cli/cli/blob/trunk/docs/install_linux.md
```

Authenticate:
```bash
gh auth login
```

#### Set Organization Secrets

**Basic syntax:**
```bash
gh secret set SECRET_NAME --org geoselect-it --visibility VISIBILITY --body "secret-value"
```

**Visibility options:**
- `all` - All repositories (public and private)
- `private` - Only private repositories
- `selected` - Specific repositories (requires additional setup)

**Examples:**

```bash
# Set Supabase URL (available to all repositories)
gh secret set SUPABASE_URL \
  --org geoselect-it \
  --visibility all \
  --body "https://your-project.supabase.co"

# Set Supabase Service Role Key (private repos only)
gh secret set SUPABASE_SERVICE_ROLE_KEY \
  --org geoselect-it \
  --visibility private \
  --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Set DigitalOcean token (all repositories)
gh secret set DIGITALOCEAN_ACCESS_TOKEN \
  --org geoselect-it \
  --visibility all \
  --body "dop_v1_your_token_here"

# Set database URL (private repositories only)
gh secret set DATABASE_URL \
  --org geoselect-it \
  --visibility private \
  --body "postgresql://user:pass@host:5432/db"

# Set Docker credentials (all repositories)
gh secret set DOCKER_USERNAME \
  --org geoselect-it \
  --visibility all \
  --body "your-docker-username"

gh secret set DOCKER_PASSWORD \
  --org geoselect-it \
  --visibility all \
  --body "your-docker-password"

gh secret set DOCKER_REGISTRY_URL \
  --org geoselect-it \
  --visibility all \
  --body "registry.hub.docker.com"
```

**Set secret from file (safer for large secrets):**
```bash
# Save secret to a temporary file (ensure it's in .gitignore)
echo "your-secret-value" > /tmp/secret.txt

# Set the secret from the file
gh secret set SECRET_NAME \
  --org geoselect-it \
  --visibility all \
  --body @/tmp/secret.txt

# Remove the temporary file
rm /tmp/secret.txt
```

**Bulk setup script:**

Create a script `setup-secrets.sh`:
```bash
#!/bin/bash

# GitHub organization
ORG="geoselect-it"

# Read secrets from a secure source (DO NOT commit this file)
# Example: Load from 1Password CLI, environment, or encrypted file

gh secret set SUPABASE_URL --org $ORG --visibility all --body "$SUPABASE_URL"
gh secret set SUPABASE_SERVICE_ROLE_KEY --org $ORG --visibility private --body "$SUPABASE_SERVICE_ROLE_KEY"
gh secret set DIGITALOCEAN_ACCESS_TOKEN --org $ORG --visibility all --body "$DIGITALOCEAN_ACCESS_TOKEN"
gh secret set DATABASE_URL --org $ORG --visibility private --body "$DATABASE_URL"
gh secret set DOCKER_USERNAME --org $ORG --visibility all --body "$DOCKER_USERNAME"
gh secret set DOCKER_PASSWORD --org $ORG --visibility all --body "$DOCKER_PASSWORD"
gh secret set DOCKER_REGISTRY_URL --org $ORG --visibility all --body "$DOCKER_REGISTRY_URL"

echo "✅ Organization secrets configured successfully"
```

**List existing secrets:**
```bash
# View all organization secrets
gh secret list --org geoselect-it
```

### Method 3: GitHub REST API (Advanced)

For advanced automation or integration with secret management tools, use the GitHub REST API.

#### Prerequisites

- GitHub Personal Access Token with `admin:org` scope
- `curl` or similar HTTP client

#### Get Organization Public Key

Before setting secrets, you need to get the organization's public key for encryption:

```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/orgs/geoselect-it/actions/secrets/public-key
```

Response:
```json
{
  "key_id": "012345678912345678",
  "key": "base64-encoded-public-key"
}
```

#### Encrypt Secret Value

Secrets must be encrypted using libsodium before sending to the API. Here's a Node.js example:

```javascript
// encrypt-secret.js
const sodium = require('libsodium-wrappers');

async function encryptSecret(publicKey, secretValue) {
  await sodium.ready;
  
  // Convert the secret and key to Uint8Array
  const binkey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const binsec = sodium.from_string(secretValue);
  
  // Encrypt the secret
  const encBytes = sodium.crypto_box_seal(binsec, binkey);
  
  // Convert to base64
  const output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
  
  return output;
}

// Usage
const publicKey = "your-org-public-key";
const secretValue = "your-secret-value";

encryptSecret(publicKey, secretValue).then(encrypted => {
  console.log(encrypted);
});
```

#### Set Organization Secret via API

```bash
# Set the encrypted secret
curl -X PUT \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/orgs/geoselect-it/actions/secrets/SECRET_NAME \
  -d '{
    "encrypted_value": "ENCRYPTED_SECRET_VALUE",
    "key_id": "012345678912345678",
    "visibility": "all"
  }'
```

**Visibility options:**
- `all` - All repositories
- `private` - Private repositories only
- `selected` - Specific repositories (requires `selected_repository_ids` field)

**Example with selected repositories:**
```bash
curl -X PUT \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/orgs/geoselect-it/actions/secrets/SECRET_NAME \
  -d '{
    "encrypted_value": "ENCRYPTED_SECRET_VALUE",
    "key_id": "012345678912345678",
    "visibility": "selected",
    "selected_repository_ids": [1234567, 7654321]
  }'
```

#### List Organization Secrets

```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/orgs/geoselect-it/actions/secrets
```

---

## Section C: Required Organization Secrets List

The following secrets should be configured at the `geoselect-it` organization level for use in GitHub Actions workflows across multiple repositories.

### Core Secrets (Required for All Deployments)

| Secret Name | Description | Where to Get | Visibility |
|------------|-------------|--------------|------------|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API | `all` or `private` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-side only) | Supabase Dashboard → Settings → API | `private` |
| `DATABASE_URL` | PostgreSQL connection string | Supabase or database provider | `private` |
| `DIGITALOCEAN_ACCESS_TOKEN` | DigitalOcean API token for deployments | DigitalOcean → API → Tokens | `all` or `private` |
| `DO_APP_NAME` | DigitalOcean App Platform app name | Your DigitalOcean app configuration | `all` or `private` |

### Docker Registry Secrets (Required for Container Workflows)

| Secret Name | Description | Where to Get | Visibility |
|------------|-------------|--------------|------------|
| `DOCKER_REGISTRY_URL` | Docker registry URL | Docker Hub, DigitalOcean CR, or GHCR | `all` |
| `DOCKER_USERNAME` | Docker registry username | Docker Hub or registry provider | `all` |
| `DOCKER_PASSWORD` | Docker registry password/token | Docker Hub or registry provider | `private` |

### Authentication Secrets (Optional, Repository-Specific)

These may be better suited as repository secrets rather than organization secrets:

| Secret Name | Description | Where to Get | Visibility |
|------------|-------------|--------------|------------|
| `AUTH_SECRET` | JWT signing secret | Generate with `openssl rand -base64 32` | Repository-level |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Stripe Dashboard → Developers → API keys | Repository-level |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard → Developers → Webhooks | Repository-level |

### Quick Setup Checklist

Use this checklist to ensure all required secrets are configured:

- [ ] `SUPABASE_URL` - Set and accessible to target repositories
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set with private visibility
- [ ] `DATABASE_URL` - Set with private visibility
- [ ] `DIGITALOCEAN_ACCESS_TOKEN` - Set and accessible to deployment repos
- [ ] `DO_APP_NAME` - Set and accessible to deployment repos
- [ ] `DOCKER_REGISTRY_URL` - Set if using Docker workflows
- [ ] `DOCKER_USERNAME` - Set if using Docker workflows
- [ ] `DOCKER_PASSWORD` - Set if using Docker workflows
- [ ] Verify repository access for each secret
- [ ] Test secrets in a workflow run

### Verifying Secrets are Available

Create a test workflow to verify secrets are accessible:

```yaml
# .github/workflows/test-secrets.yml
name: Test Secrets Access

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Check Secrets
        run: |
          echo "Testing secret availability (not showing values)"
          [[ -n "${{ secrets.SUPABASE_URL }}" ]] && echo "✅ SUPABASE_URL available" || echo "❌ SUPABASE_URL missing"
          [[ -n "${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" ]] && echo "✅ SUPABASE_SERVICE_ROLE_KEY available" || echo "❌ SUPABASE_SERVICE_ROLE_KEY missing"
          [[ -n "${{ secrets.DATABASE_URL }}" ]] && echo "✅ DATABASE_URL available" || echo "❌ DATABASE_URL missing"
          [[ -n "${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}" ]] && echo "✅ DIGITALOCEAN_ACCESS_TOKEN available" || echo "❌ DIGITALOCEAN_ACCESS_TOKEN missing"
          [[ -n "${{ secrets.DOCKER_USERNAME }}" ]] && echo "✅ DOCKER_USERNAME available" || echo "❌ DOCKER_USERNAME missing"
          [[ -n "${{ secrets.DOCKER_PASSWORD }}" ]] && echo "✅ DOCKER_PASSWORD available" || echo "❌ DOCKER_PASSWORD missing"
          [[ -n "${{ secrets.DOCKER_REGISTRY_URL }}" ]] && echo "✅ DOCKER_REGISTRY_URL available" || echo "❌ DOCKER_REGISTRY_URL missing"
```

---

## Section D: Security Best Practices

### 1. Never Commit Actual Secrets

**What to avoid:**
- ❌ Committing `.env` or `.env.local` files with actual values
- ❌ Hardcoding secrets in source code
- ❌ Committing backup files with secrets (`.env.backup`, etc.)
- ❌ Storing secrets in comments or documentation
- ❌ Including secrets in git commit messages

**What to do:**
- ✅ Use `.env.example` with placeholder values
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use environment variables or secret management tools
- ✅ Review commits before pushing with `git diff --cached`

**If you accidentally commit a secret:**
1. **Revoke the compromised secret immediately** (see Section 4.6)
2. Generate a new secret
3. Update the secret in all environments
4. Consider rewriting git history if the secret was recently committed (use `git filter-branch` or BFG Repo-Cleaner)
5. Notify your team and security contact

### 2. Rotate Secrets Regularly

Regularly rotating secrets reduces the window of opportunity if a secret is compromised.

**Recommended rotation schedule:**
- **Critical secrets** (service role keys, admin tokens): Every 30-90 days
- **API keys** (Stripe, external APIs): Every 90-180 days
- **Database passwords**: Every 90 days or when team members change
- **GitHub tokens**: Every 90 days or when needed
- **OAuth secrets**: Every 180 days or when needed

**Rotation process:**
1. Generate new secret in the service (Supabase, Stripe, etc.)
2. Update secret in GitHub organization settings
3. Update secret in local development environments (notify team)
4. Test that services still work with new secret
5. Revoke old secret
6. Document the rotation date

**Automate rotation reminders:**
```bash
# Add to your calendar or project management tool
# Example: Calendar reminder every 90 days
```

### 3. Use Different Secrets for Different Environments

Never use the same secrets across development, staging, and production environments.

**Environment separation:**

| Environment | Secrets Source | Purpose |
|-------------|---------------|---------|
| **Development** | `.env.local` (local machine) | Local testing, safe to experiment |
| **Staging** | GitHub repository secrets | Pre-production testing |
| **Production** | GitHub organization secrets | Live application |

**Example setup:**
- **Development Supabase Project**: `https://dev-project.supabase.co`
- **Staging Supabase Project**: `https://staging-project.supabase.co`
- **Production Supabase Project**: `https://prod-project.supabase.co`

**Benefits:**
- Prevents accidental production data access during development
- Limits blast radius of compromised development secrets
- Allows testing secret rotation without affecting production

### 4. Principle of Least Privilege

Grant the minimum permissions necessary for each secret.

**Examples:**

**GitHub Personal Access Tokens:**
- ❌ Don't use `repo` scope if you only need `read:repo`
- ❌ Don't use `admin:org` if you only need `read:org`
- ✅ Create separate tokens for different purposes with minimal scopes

**Database Access:**
- ❌ Don't use root/admin credentials in application code
- ✅ Create application-specific database users with limited permissions
- ✅ Use separate read-only credentials for reporting/analytics

**Supabase Keys:**
- ❌ Don't use `service_role` key in client-side code
- ✅ Use `anon` key for client-side operations
- ✅ Use `service_role` only in server-side code when necessary

**API Tokens:**
- ✅ Use read-only tokens when possible
- ✅ Scope tokens to specific resources (e.g., specific Docker registry)

### 5. Repository Access Control for Organization Secrets

When setting organization secrets, carefully configure repository access.

**Access patterns:**

| Secret Type | Recommended Access | Reasoning |
|------------|-------------------|-----------|
| **Production database** | Selected repositories only | Limit exposure to production data |
| **Development services** | All repositories | Safe to share across projects |
| **Deployment tokens** | Private repositories | Prevent unauthorized deployments |
| **Service integrations** | All or private repositories | Based on sensitivity |

**Review access periodically:**
1. Go to organization secrets settings
2. Click on each secret
3. Review **Repository access** section
4. Remove access from repositories that no longer need it

### 6. How to Revoke Compromised Secrets

If a secret is compromised (committed to git, exposed in logs, etc.), act immediately:

#### Immediate Actions (Do Now)

1. **Identify the compromised secret**
   - Which secret was exposed?
   - What level of access does it provide?
   - Which repositories/environments use it?

2. **Revoke the secret immediately**
   
   **Supabase:**
   - Go to Dashboard → Settings → API
   - Click "Reset" on the service_role key
   - Generate new key immediately
   
   **DigitalOcean:**
   - Go to API → Tokens/Keys
   - Delete the compromised token
   - Generate new token
   
   **GitHub:**
   - Go to Settings → Developer settings → Tokens
   - Delete the compromised token
   - Generate new token
   
   **Stripe:**
   - Go to Developers → API keys
   - Roll the secret key (this invalidates the old one)
   
   **Docker Hub:**
   - Go to Account Settings → Security
   - Delete the compromised token
   - Generate new token

3. **Update the secret everywhere**
   - Update in GitHub organization secrets
   - Update in all local development environments (notify team)
   - Update in any other secret stores (1Password, AWS Secrets Manager, etc.)

4. **Test thoroughly**
   - Verify all services work with new secret
   - Check GitHub Actions workflows
   - Test local development setup

#### Follow-up Actions (Do Soon)

5. **Investigate the exposure**
   - How was the secret compromised?
   - Who had access to the secret?
   - What actions were taken with the compromised secret?

6. **Review audit logs**
   
   **GitHub:**
   ```bash
   gh api /orgs/geoselect-it/audit-log --jq '.[] | select(.action | contains("secret"))'
   ```
   
   **Supabase:**
   - Check API logs for unusual activity
   
   **DigitalOcean:**
   - Review audit logs in control panel

7. **Update security processes**
   - Document the incident
   - Update team training
   - Implement additional safeguards

#### Prevention Checklist

- [ ] Enable pre-commit hooks to scan for secrets (use tools like `git-secrets` or `truffleHog`)
- [ ] Use secret scanning tools (GitHub has built-in secret scanning)
- [ ] Educate team on secret management
- [ ] Regularly audit who has access to secrets
- [ ] Use 2FA on all accounts that manage secrets

### 7. Secret Masking in Logs

GitHub Actions automatically masks secrets in logs, but follow these practices:

**Do:**
- ✅ Use `${{ secrets.SECRET_NAME }}` syntax in workflows
- ✅ GitHub automatically masks exact string matches
- ✅ Test workflows to ensure secrets aren't exposed

**Don't:**
- ❌ Print secrets with `echo "$SECRET"` (it may still appear)
- ❌ Use secrets in pull request titles or comments
- ❌ Log API responses that might contain secrets

**Safe logging:**
```yaml
# ❌ BAD: Could expose parts of the secret
- name: Debug
  run: echo "URL is ${{ secrets.SUPABASE_URL }}"

# ✅ GOOD: Confirms presence without exposing value
- name: Check Secret
  run: |
    if [[ -z "${{ secrets.SUPABASE_URL }}" ]]; then
      echo "❌ SUPABASE_URL is not set"
      exit 1
    else
      echo "✅ SUPABASE_URL is configured"
    fi
```

### 8. Local Development Security

**Secure your local machine:**
- Use full-disk encryption
- Use a password manager for storing personal copies of secrets
- Lock your computer when away
- Use secure Wi-Fi networks
- Keep your OS and applications updated

**VS Code security:**
- Never commit `.vscode/settings.json` with secrets
- Use workspace trust feature
- Be careful with VS Code extensions that request broad permissions
- Review extension permissions before installing

### 9. Team Access Management

**When team members join:**
1. Grant access to necessary secrets
2. Provide this documentation
3. Ensure they set up 2FA on GitHub
4. Add them to team channels for security updates

**When team members leave:**
1. Remove from GitHub organization
2. Remove from external services (Supabase, DigitalOcean, etc.)
3. Rotate any secrets they had access to
4. Review audit logs for their activity
5. Update repository access controls

### 10. Monitoring and Alerts

**Set up monitoring for:**
- Failed authentication attempts
- Unusual API usage patterns
- Database queries from unexpected IPs
- Deployment failures that might indicate compromised credentials

**GitHub notifications:**
- Enable secret scanning alerts
- Enable Dependabot security alerts
- Subscribe to security advisories

**Example: Monitor GitHub Actions usage**
```bash
# Check for unusual workflow runs
gh api /repos/GeoSelect/saas-starter-NON-CANON-/actions/runs --jq '.workflow_runs[] | select(.conclusion == "failure") | {name: .name, created_at: .created_at, conclusion: .conclusion}'
```

---

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12-Factor App: Config](https://12factor.net/config)

---

## Support

If you encounter issues with secrets setup:

1. Check this documentation for troubleshooting steps
2. Review GitHub Actions workflow logs for error messages
3. Verify secrets are set correctly in organization settings
4. Contact the team lead or DevOps administrator

**Common issues:**
- **"Secret not found"**: Check repository access configuration for the secret
- **"Authentication failed"**: Secret value may be incorrect or expired
- **"Permission denied"**: Token may lack required scopes/permissions
