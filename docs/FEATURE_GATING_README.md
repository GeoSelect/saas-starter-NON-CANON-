# Feature Gating System (C046) Documentation

## Overview

Complete demo data implementation for premium features with subscription requirements across 7 plan tiers.

**Features:**
- 16 premium features categorized by type (search, analysis, CRM, reporting, admin, integration)
- 7 subscription plans from free Browse to $999/month Portfolio
- Feature access control based on user's subscription plan
- Database schema with feature entitlements, usage tracking, and access logs
- React components and hooks for enforcing feature restrictions
- Demo page showing feature matrix and gating components

## Architecture

### Demo Data Tables (In-Memory)

Located in `lib/features/index.ts`:

```typescript
// Feature Definitions (16 total)
FEATURES: Record<FeatureId, Feature> = {
  'basic-search',
  'advanced-search',
  'map-view',
  'saved-searches',
  'property-comparison',
  'market-analysis',
  'ai-insights',
  'crm-contacts',
  'crm-pipeline',
  'crm-automation',
  'data-export',
  'custom-reports',
  'api-access',
  'team-collaboration',
  'white-label',
  'audit-trail'
}

// Subscription Plans (7 total)
PLANS: Record<PlanType, PlanDetails> = {
  'browse': $0/mo      (Free)
  'home': $29/mo       (Homebuyers/Sellers)
  'studio': $79/mo     (Individual Professionals)
  'pro-workspace': $199/mo  (Team Collaboration) ⭐
  'pro-crm': $249/mo   (Full CRM Suite)
  'pro-ai': $349/mo    (AI + API Access)
  'portfolio': $999/mo  (Enterprise/White-Label)
}

// Feature Matrix
FEATURE_MATRIX: Record<PlanType, FeatureId[]>
// Shows which features are available at each plan level
```

## Feature Categories

### Search (4 features)
- Basic Search - Available in Browse
- Advanced Search - Studio+
- Map View - Home+
- Saved Searches - Home+

### Analysis (3 features)
- Property Comparison - Studio+
- Market Analysis - Pro Workspace+
- AI Insights - Pro AI+

### CRM (3 features)
- Contact Management - Pro CRM+
- Sales Pipeline - Pro CRM+
- Workflow Automation - Pro CRM+

### Reporting (3 features)
- Data Export - Studio+
- Custom Reports - Pro Workspace+
- API Access - Pro AI+

### Admin (3 features)
- Team Collaboration - Pro Workspace+
- White Label - Portfolio only
- Audit Trail - Pro Workspace+

## Subscription Plans Detail

| Plan | Price | Users | Storage | API Calls | Support |
|------|-------|-------|---------|-----------|---------|
| Browse | Free | 1 | 1GB | 0 | Community |
| Home | $29 | 2 | 10GB | 1K | Email |
| Studio | $79 | 1 | 50GB | 10K | Email |
| Pro + Workspace | $199 | 10 | 500GB | 100K | Priority ⭐ |
| Pro + CRM | $249 | 10 | 500GB | 100K | Priority |
| Pro + AI | $349 | 10 | 500GB | 500K | Priority |
| Portfolio | $999 | 100 | 5TB | 1M | Dedicated |

## Usage

### 1. Check Feature Access

```typescript
// Using hook
import { useFeatureGating } from '@/lib/hooks/useFeatureGating';

function Dashboard() {
  const { hasAccess } = useFeatureGating({ userPlan: 'studio' });
  
  if (!hasAccess('ai-insights')) {
    return <UpgradePrompt />;
  }
  
  return <AIInsightsComponent />;
}
```

### 2. Conditional Rendering

```typescript
// Using FeatureGate component
import { FeatureGate } from '@/lib/hooks/useFeatureGating';

function MyPage() {
  return (
    <FeatureGate 
      feature="crm-contacts"
      userPlan="studio"
      fallback={<UpgradePrompt feature="crm-contacts" />}
    >
      <CRMContactsWidget />
    </FeatureGate>
  );
}
```

### 3. UI Components

```typescript
// Feature locked banner
<FeatureLockedBanner featureId="ai-insights" userPlan="studio" />

// Feature upgrade prompt
<FeatureUpgradePrompt 
  featureId="crm-contacts"
  userPlan="studio"
  title="Unlock Contact Management"
/>

// Feature badge
<FeatureBadge featureId="market-analysis" userPlan="pro-workspace" />

// Feature comparison table
<FeatureComparisonTable />
```

### 4. Global Context

```typescript
// Wrap app with provider
<FeatureGatingProvider userPlan={currentUser.plan}>
  <Dashboard />
</FeatureGatingProvider>

// Use anywhere
import { useFeatureGatingContext } from '@/lib/features/FeatureGatingContext';

function SomeComponent() {
  const { hasAccess, lockedFeatures } = useFeatureGatingContext();
  
  if (!hasAccess('api-access')) {
    // Show upgrade CTA
  }
}
```

## Database Integration

### Migration File
`migrations/002_create_feature_gating.sql`

### Tables Created
- `features` - Feature definitions
- `subscription_plans` - Plan configurations
- `plan_features` - Feature matrix
- `user_feature_entitlements` - User access rights
- `feature_usage` - Usage tracking
- `feature_access_logs` - Access attempt logs

### Views Created
- `v_user_feature_access` - User's current feature access
- `v_feature_usage_summary` - Feature usage statistics
- `v_plan_features` - Feature matrix view

### Stored Procedures
- `sp_grant_feature_to_user()` - Grant feature with expiration
- `sp_revoke_feature_from_user()` - Revoke feature
- `sp_grant_plan_features()` - Grant all plan features

## Helper Functions

```typescript
// Check if plan has feature
hasFeature(plan: PlanType, featureId: FeatureId): boolean

// Get minimum plan required for feature
getMinPlanForFeature(featureId: FeatureId): PlanType

// Get all features in a plan
getFeaturesForPlan(plan: PlanType): Feature[]

// Get features available for upgrade
getUpgradeFeatures(currentPlan: PlanType): Feature[]

// Get plan details
getPlanDetails(plan: PlanType): PlanDetails

// Get all plans sorted by price
getAllPlans(): PlanDetails[]
```

## Demo Pages

### Feature Gating Demo Page
`app/(dashboard)/feature-gating/page.tsx`

Interactive demo showing:
- Plan selector
- Feature availability by category
- Example UI components
- Complete feature matrix
- Integration documentation

**Access:** `/feature-gating` (after login to dashboard)

### Enhanced Pricing Page
`app/(dashboard)/pricing/enhanced-page.tsx`

Shows:
- Plan cards with feature lists
- Billing period toggle (monthly/annual)
- Feature matrix table
- FAQ section
- Support level indicators

## Integration Points

### 1. Sign-Up Flow
When user signs up with plan `pro-workspace`:
```typescript
// Grant all pro-workspace features
await grantPlanFeatures(userId, 'pro-workspace');

// Log to audit trail
await logAuditEvent(userId, name, email, 'pro-workspace', 'plan_change', 'success');
```

### 2. Plan Upgrade
When user upgrades to new plan:
```typescript
// Revoke old plan features
await revokePlanFeatures(userId, oldPlan);

// Grant new plan features
await grantPlanFeatures(userId, newPlan);

// Log the change
await logAuditEvent(userId, name, email, newPlan, 'plan_change', 'success');
```

### 3. Feature Access Check
On page render:
```typescript
// Check before showing feature
if (!hasFeature(userPlan, 'crm-contacts')) {
  return <FeatureLockedBanner featureId="crm-contacts" />;
}

// Show feature
return <CRMComponent />;
```

### 4. Usage Tracking
Track feature usage:
```typescript
// Log feature usage
await logFeatureUsage(userId, 'market-analysis', 'view');

// Query usage later
const usage = await getFeatureUsage(userId, 'market-analysis');
```

## File Structure

```
lib/features/
├── index.ts                    # Feature definitions & data
└── FeatureGatingContext.tsx    # React context provider

lib/hooks/
└── useFeatureGating.ts         # Feature gating hook

components/
└── FeaturePaywall.tsx          # UI components

app/(dashboard)/
├── feature-gating/
│   └── page.tsx               # Demo page
├── pricing/
│   └── enhanced-page.tsx       # Enhanced pricing page
└── ...

migrations/
└── 002_create_feature_gating.sql # Database schema
```

## Next Steps

1. **Execute Database Migration** - Run `002_create_feature_gating.sql` on your database
2. **Update Auth Flow** - Call `sp_grant_plan_features()` when user signs up or upgrades
3. **Add Feature Checks** - Use `hasFeature()` or `<FeatureGate>` in your components
4. **Track Usage** - Log feature usage with `logFeatureUsage()`
5. **Monitor Access** - View access patterns in `feature_access_logs` table

## Security Considerations

- Feature access enforced both client-side (UX) and server-side (API)
- API endpoints should verify user's plan before granting access
- Usage tracked in database for audit and analytics
- Feature expiration supported for trial periods
- Revocation immediate - no cached access tokens

## Performance Optimizations

- Feature matrix cached in-memory for fast lookups
- User entitlements queried at login and cached in session
- Access checks O(1) - simple array/map lookups
- Database indexes on user_id, feature_id, plan_id for fast queries
- Views pre-compute common queries (usage summary, feature matrix)

## Analytics

Query feature usage:
```sql
SELECT f.name, COUNT(*) as usage_count
FROM feature_usage fu
JOIN features f ON fu.feature_id = f.id
WHERE fu.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY f.name
ORDER BY usage_count DESC;
```

Query plan distribution:
```sql
SELECT sp.display_name, COUNT(DISTINCT ufe.user_id) as user_count
FROM user_feature_entitlements ufe
JOIN subscription_plans sp ON ufe.plan_id = sp.id
WHERE ufe.revoked_at IS NULL
GROUP BY sp.display_name
ORDER BY user_count DESC;
```

## Support

For questions about feature gating, see:
- `lib/features/index.ts` - Feature definitions
- `lib/audit/INTEGRATION_GUIDE.ts` - Integration examples
- Demo page at `/feature-gating` - Interactive examples
