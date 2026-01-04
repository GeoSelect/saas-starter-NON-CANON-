# CCP-07: Data Sources & Rule Management

## Overview

CCP-07 provides a structured framework for managing authoritative sources (HOA CCRs, jurisdiction codes, ordinances), defining rules and constraints, tracking citations and sources, and identifying data quality gaps.

This complements CCP-04 (Immutable Snapshots) by adding a **data quality and sourcing layer** above the immutable parcel intelligence.

**Core Architecture:**
- **Sources**: Authoritative reference documents (HOA CCRs, ordinances, zoning codes)
- **Rules**: Constraint definitions linked to workspaces and parcels
- **Citations**: Traceable links between rules and their sources
- **Data Gaps**: Missing, conflicting, outdated, or unverified information

## Database Schema

### Table: `sources`

Authoritative documents and reference materials.

```sql
CREATE TABLE sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'hoa_ccr', 'jurisdiction_code', 'ordinance', etc.
  url TEXT,
  jurisdiction TEXT,
  last_verified_at TIMESTAMPTZ,
  confidence_level TEXT, -- 'verified', 'inferred', 'pending'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Types:**
- `hoa_ccr` - HOA Covenants, Conditions, and Restrictions
- `jurisdiction_code` - Municipal code or ordinance
- `ordinance` - City/county ordinance
- `county_records` - County assessor or records
- `assessor` - Tax assessor data
- `zoning` - Zoning designation or code
- `custom` - User-uploaded document

**Confidence Levels:**
- `verified` - Source has been reviewed and confirmed
- `inferred` - Source inferred from related documents
- `pending` - Source awaiting verification

**Index Strategy:**
- `type` - Find sources by classification
- `jurisdiction` - Find sources for a specific area
- `confidence_level` - Query verified vs. pending sources
- `last_verified_at` - Track stale sources

### Table: `rules`

Constraint and requirement definitions.

```sql
CREATE TABLE rules (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  parcel_id VARCHAR(128), -- Optional: specific parcel
  rule_type TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB, -- Additional metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Rule Types:**
- `setback` - Minimum distance from property line
- `height_limit` - Maximum building height
- `density` - Maximum units/coverage
- `use_restriction` - Permitted uses
- `parking` - Parking requirements
- `other` - Miscellaneous constraints

**Details** (example for setback):
```json
{
  "setback_feet": 25,
  "applies_to": "rear",
  "applies_to_sides": false,
  "exceptions": "None"
}
```

### Table: `rule_sources`

Many-to-many linking rules to their authoritative sources.

```sql
CREATE TABLE rule_sources (
  rule_id UUID REFERENCES rules(id),
  source_id UUID REFERENCES sources(id),
  citation TEXT, -- e.g., "Section 4.2, Paragraph 3"
  citation_date TIMESTAMPTZ,
  PRIMARY KEY (rule_id, source_id)
);
```

**Citation Format Examples:**
- `Section 4.2, Paragraph 3`
- `HOA CC&R Article IV, Section 2.1`
- `Telluride Town Code Chapter 13, Subsection 13.4.2(c)`
- `Zoning Map Amendment #2024-15`

### Table: `data_gaps`

Tracking missing, conflicting, or outdated information.

```sql
CREATE TABLE data_gaps (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  parcel_id VARCHAR(128),
  gap_type TEXT NOT NULL, -- 'missing', 'conflict', 'outdated', 'unverified'
  description TEXT NOT NULL,
  severity TEXT, -- 'critical', 'warning', 'info'
  resolution_status TEXT, -- 'open', 'investigating', 'resolved'
  reported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);
```

**Gap Types:**
- `missing` - Information not found in any source
- `conflict` - Contradictory information in different sources
- `outdated` - Information verified but potentially stale
- `unverified` - Information inferred but not confirmed

**Severity:**
- `critical` - Affects legal compliance or safety
- `warning` - Important but may have workarounds
- `info` - Informational, lower priority

## Helper Functions

### Sources

#### `getSources(filters?): Promise<Source[]>`

Retrieve sources with optional filtering.

```typescript
const allSources = await getSources();

const hoaccrSources = await getSources({
  type: "hoa_ccr",
});

const verifiedSources = await getSources({
  confidenceLevel: "verified",
});

const tellurideSources = await getSources({
  jurisdiction: "Telluride, CO",
});
```

#### `createSource(name, type, options?): Promise<Source>`

Create a new source.

```typescript
const source = await createSource(
  "Telluride Town Code Chapter 13",
  "ordinance",
  {
    url: "https://telluride.town/code",
    jurisdiction: "Telluride, CO",
    confidence_level: "pending",
  }
);
```

#### `verifySource(sourceId): Promise<Source>`

Mark a source as verified with timestamp.

```typescript
const verified = await verifySource("source-uuid");
// Sets: confidence_level = 'verified', last_verified_at = now()
```

### Rules

#### `createRule(workspaceId, ruleType, description, options?): Promise<Rule>`

Define a new rule in a workspace.

```typescript
const rule = await createRule(
  "workspace-uuid",
  "setback",
  "25-foot rear setback required",
  {
    parcel_id: "parcel-123",
    details: {
      setback_feet: 25,
      applies_to: "rear",
      applies_to_sides: false,
    },
  }
);
```

#### `getRules(workspaceId, parcelId?): Promise<Rule[]>`

Get rules for a workspace, optionally filtered by parcel.

```typescript
const allRules = await getRules("workspace-uuid");

const parcelRules = await getRules("workspace-uuid", "parcel-123");
```

#### `linkRuleToSource(ruleId, sourceId, citation?): Promise<RuleSource>`

Create a citation linking a rule to a source.

```typescript
const citation = await linkRuleToSource(
  "rule-uuid",
  "source-uuid",
  "Section 13.4.2(c)"
);
```

#### `getRuleSources(ruleId): Promise<RuleSource[]>`

Get all sources cited by a rule.

```typescript
const sources = await getRuleSources("rule-uuid");
// Returns: [
//   {
//     rule_id: "rule-uuid",
//     source_id: "source-uuid",
//     citation: "Section 13.4.2(c)",
//     sources: { id, name, type, url, confidence_level }
//   }
// ]
```

### Data Gaps

#### `reportDataGap(workspaceId, gapType, description, options?): Promise<DataGap>`

Report a data quality issue.

```typescript
const gap = await reportDataGap(
  "workspace-uuid",
  "missing",
  "HOA setback requirements not found in online sources",
  {
    parcel_id: "parcel-123",
    severity: "critical",
  }
);
```

#### `getDataGaps(workspaceId, filters?): Promise<DataGap[]>`

Get gaps for a workspace with optional filtering.

```typescript
const allGaps = await getDataGaps("workspace-uuid");

const criticalGaps = await getDataGaps("workspace-uuid", {
  severity: "critical",
});

const openGaps = await getDataGaps("workspace-uuid", {
  resolution_status: "open",
});

const parcelGaps = await getDataGaps("workspace-uuid", {
  parcel_id: "parcel-123",
  gap_type: "conflict",
});
```

#### `updateDataGapStatus(gapId, status): Promise<DataGap>`

Update gap resolution status.

```typescript
const updated = await updateDataGapStatus("gap-uuid", "investigating");

const resolved = await updateDataGapStatus("gap-uuid", "resolved");
// Sets: resolution_status = 'resolved', resolved_at = now()
```

## RLS Policies

### Sources
- **SELECT**: Public (anyone can read reference sources)
- **INSERT**: Authenticated workspace members only
- **UPDATE**: Authenticated workspace members only

### Rules
- **SELECT**: Workspace members only
- **INSERT**: Workspace members only
- **UPDATE**: Workspace members only
- **DELETE**: Workspace members only

### Rule Sources
- **SELECT**: Workspace members (can see citations for rules in their workspace)
- **INSERT**: Workspace members only

### Data Gaps
- **SELECT**: Workspace members only
- **INSERT**: Workspace members only
- **UPDATE**: Workspace members only
- **DELETE**: Workspace members only

## Integration with Existing Data

### Parcels + CCP-07

Current `parcels.sources` is a simple JSONB array:
```json
["Assessor", "Zoning"]
```

CCP-07 allows enrichment with structured sources:
```typescript
// Get all sources for a parcel
const sources = await getSources({
  type: "assessor",
  jurisdiction: "San Miguel County, CO"
});

// Create a rule based on zoning
const rule = await createRule(
  workspaceId,
  "density",
  "Maximum 2 units per acre per zoning designation",
  {
    parcel_id: "parcel-456",
    details: { max_units_per_acre: 2 }
  }
);

// Link to zoning ordinance
await linkRuleToSource(rule.id, zoningSourceId, "Section 17.11.2");
```

### Reports + CCP-07

When creating a CCP-04 report snapshot, track the sources used:

```typescript
// Report finds potential violations
const report = {
  id: "rpt-001",
  parcelId: "parcel-123",
  findings: {
    violations: [
      {
        type: "setback",
        description: "Building exceeds 25-foot setback requirement",
        rule_id: "rule-456", // Linked to CCP-07 rule
      }
    ]
  }
};

// Trace violation to authoritative source
const sources = await getRuleSources("rule-456");
// User knows exactly which ordinance applies
```

### Data Quality Workflow

```
1. Create report snapshot (CCP-04)
   ↓
2. Check against rules (CCP-07)
   ↓
3. Identify missing/conflicting data (CCP-07)
   ↓
4. Report gaps (CCP-07)
   ↓
5. Investigate and resolve
   ↓
6. Re-snapshot when resolved (CCP-04)
```

## Use Cases

### Telluride Property Analysis

1. **Setup Sources**
   - Import Telluride Town Code Chapter 13 (zoning)
   - Import HOA CC&Rs for relevant associations
   - Track San Miguel County assessor data

2. **Define Rules**
   - Setback: 25 feet (rear), 15 feet (sides)
   - Height: 35 feet
   - Density: 2 units per acre
   - Sources: TTC § 13.4.2, HOA CC&Rs Article IV

3. **Track Gaps**
   - Some HOA documents are pending verification
   - Conflict between county records and county code
   - Setback requirements for corner lots are ambiguous

4. **Reports Use Rules**
   - When analyzing a parcel, check rules
   - Report findings with citations
   - Users see exactly which ordinance applies

### Conflict Resolution

**Scenario:** Parcel analysis shows conflicting setback requirements.

1. Report gap: `gap_type: 'conflict'`
2. Link to both sources in `rule_sources`
3. Research actual requirement
4. Update rule with correct details
5. Resolve gap with investigation notes
6. Re-snapshot property analysis

### Source Verification

**Scenario:** New zoning ordinance released.

1. Create source with `confidence_level: 'pending'`
2. Review document
3. Create/update rules based on ordinance
4. Call `verifySource()` when reviewed
5. Confidence automatically updated to 'verified'

## Testing

Run tests:
```bash
pnpm test -- lib/workspace/sources-rules.test.ts
```

Test coverage:
- Source types and confidence levels
- Rule types and details
- Citation linking and tracking
- Data gap reporting and resolution
- RLS enforcement
- Integration with existing parcel/report data
- Workspace isolation
- Data quality tracking workflows

## Files

- [lib/workspace/sources-rules.ts](../../lib/workspace/sources-rules.ts) - Helper functions
- [lib/workspace/sources-rules.test.ts](../../lib/workspace/sources-rules.test.ts) - Tests
- [supabase/migrations/20260104_ccp07_sources_rules.sql](../../supabase/migrations/20260104_ccp07_sources_rules.sql) - Database schema

## Migration

Apply database migration:

```bash
# Via Supabase dashboard
supabase migration up

# Or via Drizzle
pnpm drizzle push
```

Verify:
```sql
SELECT COUNT(*) FROM sources;
SELECT COUNT(*) FROM rules;
SELECT COUNT(*) FROM rule_sources;
SELECT COUNT(*) FROM data_gaps;
```

## Next Steps

1. **UI Components**
   - Source browser/manager
   - Rule builder interface
   - Gap reporter modal
   - Citation editor

2. **Telemetry**
   - Track rule usage in reports
   - Monitor gap resolution rates
   - Source verification trends

3. **API Routes**
   - `POST /api/workspace/:id/sources` - Create source
   - `GET /api/workspace/:id/rules` - List rules
   - `POST /api/workspace/:id/gaps` - Report gap

4. **Advanced Features**
   - Automatic gap detection
   - Source conflict resolution suggestions
   - Rule validation when creating reports

## Related CCPs

- [CCP-04: Immutable Report Snapshots](./CCP-04-SNAPSHOT-IMMUTABILITY.md)
- [CCP-05: Workspace Hardening](./CCP-05_WORKSPACE_HARDENING.md)
- [CCP-03: Report Creation & Lifecycle](./CCP-03-REPORT-CREATE.md)
