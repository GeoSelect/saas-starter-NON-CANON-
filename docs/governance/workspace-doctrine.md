# Workspace Doctrine

**Status**: Frozen (CCP-05)  
**Version**: 1.0  
**Last Updated**: 2026-01-03

---

## Executive Summary

The **workspace** is the fundamental unit of collaboration, sharing, governance, and resource management in this system. All durable objects that require auditing, permissioning, rate-limiting, or sharing semantics are workspace-scoped. Billing remains account-scoped, but entitlement enforcement and quotas are applied at the workspace level.

---

## Core Principles

### 1. Workspace as the Unit of Collaboration

**Non-Negotiable**: The workspace is the primary container for:
- **Collaboration**: Teams work within workspaces, not accounts
- **Sharing**: Resources are shared at workspace boundaries
- **Governance**: Policies, permissions, and audit trails are workspace-scoped
- **Resource Management**: Rate limits, quotas, and entitlements are enforced per workspace

**Rationale**: Separating the collaboration boundary (workspace) from the billing boundary (account) enables:
- Multi-tenant scenarios (one account, many workspaces)
- Clear isolation and blast radius containment
- Flexible permission models without coupling to payment method
- Scalable governance as teams grow

---

### 2. Durable Objects are Workspace-Scoped

**Non-Negotiable**: Any durable object that can be:
- **Shared** (multiple users/roles access it)
- **Audited** (provenance, change history, compliance)
- **Permissioned** (RBAC, ownership, visibility controls)
- **Limited** (quotas, rate limits, usage caps)

...must be **workspace-scoped**.

**Examples**:
- Reports (CCP-03)
- Report snapshots (CCP-04)
- Parcel data (CCP-02)
- API keys (future)
- Webhooks (future)
- Contacts (CCP-06)

**Anti-Pattern**: Do not scope these to accounts. Accounts are billing entities, not collaboration entities.

---

### 3. Billing is Account-Scoped (CCP-00)

**Non-Negotiable**: Billing plans, payment methods, and invoices are attached to **accounts**, not workspaces.

**Why**:
- Single source of truth for payment
- Simplifies compliance (PCI, invoicing)
- Enables account-level plan upgrades that cascade to all workspaces
- Avoids fragmented billing across workspace boundaries

**Cascade Model**:
- Account has a plan (e.g., "Pro", "Enterprise")
- Workspaces inherit default entitlements from the account plan
- Workspaces may have **per-workspace overrides** (see below)

---

### 4. Entitlement Enforcement + Quotas are Workspace-Scoped

**Non-Negotiable**: Quotas and entitlements are enforced at the **workspace level**, with optional per-workspace overrides.

**Default Behavior**:
1. Account has a plan with default entitlements (e.g., "100 reports/month")
2. Each workspace starts with those default entitlements
3. Workspace usage is tracked independently (e.g., Workspace A uses 40/100, Workspace B uses 10/100)

**Override Behavior**:
- An account owner can grant **per-workspace overrides** (e.g., "Workspace A gets 500 reports/month")
- Overrides are stored in the workspace record (e.g., `workspace.quota_overrides`)
- Enforcement logic checks override first, falls back to account-plan default

**Examples**:
- "Max reports per month" → workspace-scoped counter
- "Max API calls per day" → workspace-scoped rate limit
- "Max storage per workspace" → workspace-scoped quota

**Rationale**:
- Prevents one workspace from exhausting account-wide quotas
- Enables fine-grained resource allocation (e.g., give more quota to production workspace, less to staging)
- Supports multi-tenant use cases (e.g., agency managing multiple client workspaces)

---

### 5. Contacts are Workspace-Scoped First

**Non-Negotiable**: Contacts (CCP-06) are **workspace-scoped** by default. An account-level directory is optional and deferred.

**Why Workspace-First**:
- Contacts are collaboration objects (team members, clients, stakeholders)
- Different workspaces may have different contact sets (e.g., Project A team vs. Project B team)
- Sharing contacts across workspaces requires explicit opt-in (future: shared directory feature)

**Future Extension (Not CCP-05)**:
- Account-level "global contact directory" for reuse across workspaces
- Workspace can "import" from account directory
- Changes to account-level contact do not cascade to workspace contacts (copy-on-import semantics)

**Anti-Pattern**: Do not couple contacts to accounts as the primary scope. This breaks workspace isolation.

---

## Architectural Implications

### Database Schema

```sql
-- Accounts: billing-scoped
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  plan_id VARCHAR NOT NULL, -- e.g., "pro", "enterprise"
  stripe_customer_id VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces: collaboration-scoped
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id),
  name VARCHAR NOT NULL,
  quota_overrides JSONB, -- per-workspace overrides (e.g., {"max_reports": 500})
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Durable objects: workspace-scoped
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  -- ...
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  -- ...
);
```

### Enforcement Logic Pseudocode

```typescript
async function enforceQuota(workspaceId: string, resource: string): Promise<boolean> {
  const workspace = await getWorkspace(workspaceId);
  const account = await getAccount(workspace.account_id);
  
  // Check per-workspace override first
  const limit = workspace.quota_overrides?.[resource] 
    ?? account.plan.default_limits[resource];
  
  const usage = await getWorkspaceUsage(workspaceId, resource);
  
  return usage < limit;
}
```

---

## Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Workspace as unit of collaboration | Separation of concerns: billing vs. governance | 2026-01-03 |
| Durable objects are workspace-scoped | Isolation, auditing, sharing semantics | 2026-01-03 |
| Billing is account-scoped | Single payment source, cascade model | 2026-01-03 |
| Quotas enforced per workspace | Blast radius containment, multi-tenant support | 2026-01-03 |
| Contacts workspace-scoped first | Defer complexity, simplify CCP-06 | 2026-01-03 |

---

## Related CCPs

- **CCP-00**: Account Context Resolve — establishes accounts as billing entities
- **CCP-05**: Workspace Context Resolve — THIS DOCUMENT
- **CCP-06**: Contact CRUD — contacts are workspace-scoped per this doctrine
- **CCP-09**: Entitlement Enforcement — quota checks reference workspace doctrine

---

## Future Considerations

1. **Cross-Workspace Sharing**: Explicit sharing model (e.g., "share report from Workspace A to Workspace B")
2. **Account-Level Contact Directory**: Optional reusable contact pool with copy-on-import semantics
3. **Workspace Templates**: Pre-configured workspace settings for rapid onboarding
4. **Workspace Transfer**: Moving workspaces between accounts (requires billing reconciliation)

---

## Compliance Notes

- **Audit Trails**: All workspace-scoped operations must emit audit events with `workspace_id`
- **GDPR**: Workspace deletion cascades to all contained durable objects (right to erasure)
- **Multi-Tenancy**: Workspace isolation prevents data leakage between tenants

---

## Acceptance Criteria (CCP-05 DoD)

- [x] File exists at `docs/governance/workspace-doctrine.md`
- [ ] Referenced from README or docs index
- [ ] Non-negotiables clearly stated
- [ ] Architectural implications documented
- [ ] Related CCPs cross-referenced

---

**Frozen By**: GitHub Copilot  
**Approved By**: [Pending User Review]  
**Changelog**: Initial doctrine (v1.0)
