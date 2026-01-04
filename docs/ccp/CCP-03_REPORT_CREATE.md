# CCP-03: Regression-Proof Report Creation

## Overview
Ensures report creation is bulletproof with comprehensive validation, error handling, transaction safety, and regression testing.

## Key Features

### 1. Input Validation & Sanitization
- Zod schema validation with detailed error messages
- Nested object validation for parcelSnapshot
- String length limits enforced
- Type coercion and normalization
- XSS prevention on text fields

### 2. Transaction Safety
- Database transactions with automatic rollback
- Atomic operations (all-or-nothing)
- Deadlock prevention
- Optimistic locking for concurrent updates

### 3. Error Handling
- Structured error responses with error codes
- User-friendly error messages
- Full context logging (userId, teamId, operation)
- Stack traces in development only
- Graceful degradation

### 4. Data Integrity
- Foreign key validation
- Unique constraint handling
- Null safety checks
- JSON schema validation for parcelSnapshot
- Immutability enforcement

### 5. Observability
- Operation timing metrics
- Success/failure tracking
- Error rate monitoring
- Performance profiling
- Audit trail logging

## Implementation

### Validation Schema

```typescript
const parcelSnapshotSchema = z.object({
  address: z.string().min(1).max(500),
  apn: z.string().max(50).optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  properties: z.record(z.any()).optional(),
  metadata: z.object({
    source: z.string(),
    retrievedAt: z.string().datetime(),
    confidence: z.number().min(0).max(1),
  }),
});

const createReportSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters')
    .max(255, 'Title too long'),
  description: z.string().max(1000).optional(),
  parcelSnapshot: parcelSnapshotSchema,
  findings: z.record(z.any()).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});
```

### Transaction Pattern

```typescript
export const createReportTransaction = async (data, user) => {
  const startTime = Date.now();
  
  return await db.transaction(async (tx) => {
    try {
      // 1. Validate user and team
      const team = await getTeamForUser(tx);
      if (!team) throw new ReportError('TEAM_NOT_FOUND');
      
      // 2. Check quota/limits
      const reportCount = await tx.select({ count: count() })
        .from(reports)
        .where(eq(reports.teamId, team.id));
      
      if (reportCount[0].count >= team.maxReports) {
        throw new ReportError('QUOTA_EXCEEDED');
      }
      
      // 3. Create report with snapshot
      const report = await tx.insert(reports).values({
        id: nanoid(12),
        teamId: team.id,
        userId: user.id,
        title: data.title,
        parcelSnapshot: data.parcelSnapshot,
        snapshotAt: new Date(),
        // ... other fields
      }).returning();
      
      // 4. Log activity
      await tx.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: 'report_created',
        metadata: { reportId: report[0].id },
      });
      
      logger.info('report_created', {
        reportId: report[0].id,
        userId: user.id,
        teamId: team.id,
        duration: Date.now() - startTime,
      });
      
      return { success: true, report: report[0] };
      
    } catch (error) {
      // Transaction automatically rolled back
      logger.error('report_create_failed', error, {
        userId: user.id,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  });
};
```

### Error Types

```typescript
export class ReportError extends Error {
  constructor(
    public code: string,
    message?: string,
    public details?: Record<string, any>
  ) {
    super(message || code);
    this.name = 'ReportError';
  }
}

export const ReportErrorCodes = {
  TEAM_NOT_FOUND: 'Team does not exist',
  QUOTA_EXCEEDED: 'Report limit reached for your plan',
  INVALID_SNAPSHOT: 'Parcel snapshot data is invalid',
  DUPLICATE_TITLE: 'A report with this title already exists',
  TRANSACTION_FAILED: 'Failed to create report',
  UNAUTHORIZED: 'You do not have permission to create reports',
} as const;
```

## Testing Strategy

### Unit Tests
```typescript
describe('createReport', () => {
  it('validates required fields', async () => {
    await expect(
      createReport({ title: 'ab' }) // Too short
    ).rejects.toThrow('Title must be at least 3 characters');
  });
  
  it('enforces unique titles within team', async () => {
    await createReport({ title: 'Test Report' });
    await expect(
      createReport({ title: 'Test Report' })
    ).rejects.toThrow(ReportError);
  });
  
  it('validates parcelSnapshot structure', async () => {
    await expect(
      createReport({
        title: 'Test',
        parcelSnapshot: { invalid: true },
      })
    ).rejects.toThrow('Invalid parcel snapshot');
  });
  
  it('rolls back on failure', async () => {
    const beforeCount = await db.select().from(reports);
    
    try {
      await createReport({ /* invalid data */ });
    } catch (error) {
      const afterCount = await db.select().from(reports);
      expect(afterCount.length).toBe(beforeCount.length);
    }
  });
});
```

### Integration Tests
```typescript
describe('Report Creation Flow', () => {
  it('creates report with full audit trail', async () => {
    const result = await createReport(validData);
    
    expect(result.success).toBe(true);
    expect(result.report.id).toBeTruthy();
    
    // Verify activity log
    const logs = await db.select().from(activityLogs)
      .where(eq(activityLogs.action, 'report_created'));
    expect(logs.length).toBeGreaterThan(0);
  });
  
  it('handles concurrent creation correctly', async () => {
    const results = await Promise.all([
      createReport(data1),
      createReport(data2),
      createReport(data3),
    ]);
    
    expect(results.every(r => r.success)).toBe(true);
    expect(new Set(results.map(r => r.report.id)).size).toBe(3);
  });
});
```

## Regression Prevention

### Pre-commit Hooks
```bash
# Run validation tests before commit
npm run test:reports
npm run lint
npm run type-check
```

### CI/CD Pipeline
```yaml
# .github/workflows/test-reports.yml
name: Test Report Creation

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:reports
      - run: npm run test:integration
```

### Monitoring Alerts
```typescript
// Alert if error rate > 5% in 5 minutes
if (errorRate > 0.05) {
  alertPagerDuty({
    severity: 'high',
    message: 'Report creation error rate elevated',
    metrics: { errorRate, totalAttempts },
  });
}
```

## Migration Path

### Phase 1: Add Validation
```sql
-- Add constraints to existing table
ALTER TABLE reports 
  ADD CONSTRAINT title_length CHECK (length(title) >= 3 AND length(title) <= 255);

ALTER TABLE reports
  ADD CONSTRAINT valid_parcel_snapshot CHECK (
    jsonb_typeof(parcel_snapshot) = 'object' AND
    parcel_snapshot ? 'address' AND
    parcel_snapshot ? 'coordinates'
  );
```

### Phase 2: Add Transactions
```typescript
// Wrap all report operations in transactions
export const updateReport = async (id, data) => {
  return await db.transaction(async (tx) => {
    // Update logic
  });
};
```

### Phase 3: Add Monitoring
```typescript
// Add metrics to all report operations
export const createReport = withMetrics('report_create', async (data) => {
  // Creation logic
});
```

## Performance Considerations

### Optimization Strategies
1. **Batch Operations**: Group multiple creates into single transaction
2. **Index Optimization**: Index on teamId, userId, createdAt
3. **Connection Pooling**: Reuse database connections
4. **Async Processing**: Queue non-critical operations
5. **Caching**: Cache team/user lookups

### Performance Targets
- p50 latency: < 100ms
- p95 latency: < 500ms
- p99 latency: < 1000ms
- Error rate: < 0.1%
- Throughput: 100+ reports/second

## Rollback Plan

### If Issues Detected
1. **Immediate**: Feature flag to disable new validation
2. **Short-term**: Rollback deployment to previous version
3. **Long-term**: Fix issues, add regression tests, redeploy

### Feature Flags
```typescript
const ENABLE_STRICT_VALIDATION = process.env.FEATURE_STRICT_VALIDATION === 'true';

if (ENABLE_STRICT_VALIDATION) {
  // Apply new validation
} else {
  // Use legacy validation
}
```

## Success Metrics

- ✅ Zero data integrity issues
- ✅ < 0.1% error rate
- ✅ 100% transaction rollback on failure
- ✅ Full audit trail for all operations
- ✅ Comprehensive test coverage (>90%)
- ✅ Performance within targets

## References

- [Zod Validation](https://zod.dev)
- [Database Transactions](https://orm.drizzle.team/docs/transactions)
- [Error Handling Best Practices](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript)
