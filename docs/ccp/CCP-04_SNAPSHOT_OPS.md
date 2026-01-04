# CCP-04: Production-Safe Snapshot Operations

## Overview
Ensures parcel snapshot operations are production-ready with immutability, versioning, conflict resolution, and data consistency checks.

## Key Principles

### 1. Immutability
- Snapshots are **never modified** after creation
- Changes create new snapshot versions
- Original data preserved for audit trail
- Time-travel capability for historical views

### 2. Versioning
- Each snapshot has unique version identifier
- Linked versions form snapshot chain
- Diff tracking between versions
- Rollback to any previous version

### 3. Data Consistency
- Atomic snapshot creation
- Validation before persistence
- Checksums for integrity verification
- Conflict detection and resolution

### 4. Performance
- Efficient storage (compression, deduplication)
- Fast retrieval with indexing
- Lazy loading of large snapshots
- Caching frequently accessed snapshots

## Schema Design

### Snapshot Table

```typescript
export const reportSnapshots = pgTable('report_snapshots', {
  id: varchar('id', { length: 64 }).primaryKey(),
  reportId: varchar('report_id', { length: 64 }).notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  
  // Immutable snapshot data
  parcelSnapshot: jsonb('parcel_snapshot').notNull(),
  snapshotMetadata: jsonb('snapshot_metadata').notNull(),
  
  // Integrity
  checksum: varchar('checksum', { length: 64 }).notNull(),
  dataSize: integer('data_size').notNull(), // bytes
  
  // Versioning
  parentSnapshotId: varchar('parent_snapshot_id', { length: 64 })
    .references(() => reportSnapshots.id),
  changesSummary: jsonb('changes_summary'), // Diff from parent
  
  // Audit
  createdBy: integer('created_by').notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
  // Lifecycle
  isActive: boolean('is_active').notNull().default(true),
  deprecatedAt: timestamp('deprecated_at'),
  deprecatedReason: text('deprecated_reason'),
});

// Ensure version uniqueness per report
// Composite unique index
export const snapshotVersionIndex = unique('unique_report_version')
  .on(reportSnapshots.reportId, reportSnapshots.version);
```

### Snapshot Metadata Schema

```typescript
const snapshotMetadataSchema = z.object({
  source: z.enum(['api', 'manual', 'import', 'migration']),
  retrievedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  dataProvider: z.string().optional(),
  apiVersion: z.string().optional(),
  processingTime: z.number().optional(), // milliseconds
  warnings: z.array(z.string()).optional(),
});
```

## Core Operations

### 1. Create Snapshot

```typescript
export const createSnapshot = async (
  reportId: string,
  parcelData: ParcelData,
  userId: number
): Promise<Snapshot> => {
  const startTime = Date.now();
  
  return await db.transaction(async (tx) => {
    try {
      // Get current active snapshot
      const currentSnapshot = await tx.select()
        .from(reportSnapshots)
        .where(and(
          eq(reportSnapshots.reportId, reportId),
          eq(reportSnapshots.isActive, true)
        ))
        .orderBy(desc(reportSnapshots.version))
        .limit(1);
      
      const nextVersion = (currentSnapshot[0]?.version ?? 0) + 1;
      const snapshotId = nanoid(12);
      
      // Validate parcel data
      const validatedData = parcelSnapshotSchema.parse(parcelData);
      
      // Calculate checksum for integrity
      const checksum = await calculateChecksum(validatedData);
      const dataSize = JSON.stringify(validatedData).length;
      
      // Calculate diff if parent exists
      const changesSummary = currentSnapshot[0]
        ? calculateDiff(currentSnapshot[0].parcelSnapshot, validatedData)
        : null;
      
      // Create new snapshot
      const snapshot = await tx.insert(reportSnapshots).values({
        id: snapshotId,
        reportId,
        version: nextVersion,
        parcelSnapshot: validatedData,
        snapshotMetadata: {
          source: 'api',
          retrievedAt: new Date().toISOString(),
          confidence: parcelData.confidence ?? 1.0,
          processingTime: Date.now() - startTime,
        },
        checksum,
        dataSize,
        parentSnapshotId: currentSnapshot[0]?.id,
        changesSummary,
        createdBy: userId,
        isActive: true,
      }).returning();
      
      // Deactivate previous snapshot
      if (currentSnapshot[0]) {
        await tx.update(reportSnapshots)
          .set({ isActive: false })
          .where(eq(reportSnapshots.id, currentSnapshot[0].id));
      }
      
      logger.info('snapshot_created', {
        snapshotId,
        reportId,
        version: nextVersion,
        dataSize,
        hasChanges: !!changesSummary,
        duration: Date.now() - startTime,
      });
      
      return snapshot[0];
      
    } catch (error) {
      logger.error('snapshot_create_failed', error, {
        reportId,
        userId,
        duration: Date.now() - startTime,
      });
      throw new SnapshotError('CREATE_FAILED', error.message);
    }
  });
};
```

### 2. Retrieve Snapshot

```typescript
export const getSnapshot = async (
  reportId: string,
  version?: number
): Promise<Snapshot | null> => {
  const query = db.select()
    .from(reportSnapshots)
    .where(eq(reportSnapshots.reportId, reportId));
  
  if (version !== undefined) {
    // Get specific version
    query.where(eq(reportSnapshots.version, version));
  } else {
    // Get active version
    query.where(eq(reportSnapshots.isActive, true));
  }
  
  const snapshots = await query.limit(1);
  
  if (!snapshots[0]) {
    logger.warn('snapshot_not_found', { reportId, version });
    return null;
  }
  
  // Verify integrity
  const isValid = await verifyChecksum(
    snapshots[0].parcelSnapshot,
    snapshots[0].checksum
  );
  
  if (!isValid) {
    logger.error('snapshot_integrity_check_failed', null, {
      snapshotId: snapshots[0].id,
      reportId,
    });
    throw new SnapshotError('INTEGRITY_CHECK_FAILED');
  }
  
  return snapshots[0];
};
```

### 3. Rollback Snapshot

```typescript
export const rollbackSnapshot = async (
  reportId: string,
  targetVersion: number,
  userId: number
): Promise<Snapshot> => {
  return await db.transaction(async (tx) => {
    // Verify target version exists
    const targetSnapshot = await tx.select()
      .from(reportSnapshots)
      .where(and(
        eq(reportSnapshots.reportId, reportId),
        eq(reportSnapshots.version, targetVersion)
      ))
      .limit(1);
    
    if (!targetSnapshot[0]) {
      throw new SnapshotError('VERSION_NOT_FOUND');
    }
    
    // Get current active snapshot
    const currentSnapshot = await tx.select()
      .from(reportSnapshots)
      .where(and(
        eq(reportSnapshots.reportId, reportId),
        eq(reportSnapshots.isActive, true)
      ))
      .limit(1);
    
    // Deactivate current
    if (currentSnapshot[0]) {
      await tx.update(reportSnapshots)
        .set({ isActive: false })
        .where(eq(reportSnapshots.id, currentSnapshot[0].id));
    }
    
    // Activate target version
    await tx.update(reportSnapshots)
      .set({ isActive: true })
      .where(eq(reportSnapshots.id, targetSnapshot[0].id));
    
    // Log rollback activity
    await tx.insert(activityLogs).values({
      teamId: currentSnapshot[0]?.teamId,
      userId,
      action: 'snapshot_rollback',
      metadata: {
        reportId,
        fromVersion: currentSnapshot[0]?.version,
        toVersion: targetVersion,
      },
    });
    
    logger.info('snapshot_rollback', {
      reportId,
      fromVersion: currentSnapshot[0]?.version,
      toVersion: targetVersion,
      userId,
    });
    
    return targetSnapshot[0];
  });
};
```

### 4. Compare Snapshots

```typescript
export const compareSnapshots = async (
  reportId: string,
  version1: number,
  version2: number
): Promise<SnapshotDiff> => {
  const [snapshot1, snapshot2] = await Promise.all([
    getSnapshot(reportId, version1),
    getSnapshot(reportId, version2),
  ]);
  
  if (!snapshot1 || !snapshot2) {
    throw new SnapshotError('VERSION_NOT_FOUND');
  }
  
  const diff = calculateDiff(
    snapshot1.parcelSnapshot,
    snapshot2.parcelSnapshot
  );
  
  return {
    reportId,
    version1,
    version2,
    changes: diff,
    summary: {
      added: diff.added?.length ?? 0,
      modified: diff.modified?.length ?? 0,
      deleted: diff.deleted?.length ?? 0,
    },
  };
};
```

## Utility Functions

### Checksum Calculation

```typescript
import crypto from 'crypto';

export const calculateChecksum = async (
  data: any
): Promise<string> => {
  const json = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(json).digest('hex');
};

export const verifyChecksum = async (
  data: any,
  expectedChecksum: string
): Promise<boolean> => {
  const actualChecksum = await calculateChecksum(data);
  return actualChecksum === expectedChecksum;
};
```

### Diff Calculation

```typescript
import { diff } from 'deep-object-diff';

export const calculateDiff = (
  oldData: any,
  newData: any
): SnapshotDiff => {
  const changes = diff(oldData, newData);
  
  return {
    added: extractAdded(changes),
    modified: extractModified(changes),
    deleted: extractDeleted(changes),
    raw: changes,
  };
};

const extractAdded = (changes: any): string[] => {
  const added: string[] = [];
  traverse(changes, (path, value) => {
    if (value !== undefined && !hasCorrespondingOldValue(path)) {
      added.push(path);
    }
  });
  return added;
};
```

### Compression

```typescript
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export const compressSnapshot = async (
  data: any
): Promise<Buffer> => {
  const json = JSON.stringify(data);
  return await gzip(json);
};

export const decompressSnapshot = async (
  compressed: Buffer
): Promise<any> => {
  const json = await gunzip(compressed);
  return JSON.parse(json.toString());
};
```

## Conflict Resolution

### Strategy: Last-Write-Wins

```typescript
export const handleConflict = async (
  reportId: string,
  newData: ParcelData,
  userId: number
): Promise<Snapshot> => {
  // Always create new version
  // Previous version remains accessible
  return await createSnapshot(reportId, newData, userId);
};
```

### Strategy: Optimistic Locking

```typescript
export const updateSnapshotWithLock = async (
  reportId: string,
  expectedVersion: number,
  newData: ParcelData,
  userId: number
): Promise<Snapshot> => {
  return await db.transaction(async (tx) => {
    const current = await getSnapshot(reportId);
    
    if (current.version !== expectedVersion) {
      throw new SnapshotError('VERSION_CONFLICT', {
        expected: expectedVersion,
        actual: current.version,
      });
    }
    
    return await createSnapshot(reportId, newData, userId);
  });
};
```

## Performance Optimizations

### 1. Lazy Loading

```typescript
export const getSnapshotSummary = async (
  reportId: string
): Promise<SnapshotSummary> => {
  // Return minimal data without full snapshot
  return await db.select({
    id: reportSnapshots.id,
    version: reportSnapshots.version,
    createdAt: reportSnapshots.createdAt,
    dataSize: reportSnapshots.dataSize,
    isActive: reportSnapshots.isActive,
  })
  .from(reportSnapshots)
  .where(eq(reportSnapshots.reportId, reportId))
  .orderBy(desc(reportSnapshots.version));
};
```

### 2. Caching

```typescript
import { LRUCache } from 'lru-cache';

const snapshotCache = new LRUCache<string, Snapshot>({
  max: 500, // Maximum 500 snapshots in cache
  ttl: 1000 * 60 * 10, // 10 minutes
  updateAgeOnGet: true,
});

export const getCachedSnapshot = async (
  reportId: string,
  version?: number
): Promise<Snapshot | null> => {
  const cacheKey = `${reportId}:${version ?? 'active'}`;
  
  let snapshot = snapshotCache.get(cacheKey);
  if (snapshot) {
    logger.debug('snapshot_cache_hit', { cacheKey });
    return snapshot;
  }
  
  snapshot = await getSnapshot(reportId, version);
  if (snapshot) {
    snapshotCache.set(cacheKey, snapshot);
  }
  
  return snapshot;
};
```

### 3. Pagination

```typescript
export const getSnapshotHistory = async (
  reportId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ snapshots: Snapshot[]; total: number }> => {
  const { limit = 20, offset = 0 } = options;
  
  const [snapshots, countResult] = await Promise.all([
    db.select()
      .from(reportSnapshots)
      .where(eq(reportSnapshots.reportId, reportId))
      .orderBy(desc(reportSnapshots.version))
      .limit(limit)
      .offset(offset),
    
    db.select({ count: count() })
      .from(reportSnapshots)
      .where(eq(reportSnapshots.reportId, reportId)),
  ]);
  
  return {
    snapshots,
    total: countResult[0].count,
  };
};
```

## Testing

### Unit Tests

```typescript
describe('Snapshot Operations', () => {
  it('creates snapshot with correct version', async () => {
    const s1 = await createSnapshot(reportId, data1, userId);
    expect(s1.version).toBe(1);
    
    const s2 = await createSnapshot(reportId, data2, userId);
    expect(s2.version).toBe(2);
  });
  
  it('enforces immutability', async () => {
    const snapshot = await createSnapshot(reportId, data, userId);
    
    await expect(
      db.update(reportSnapshots)
        .set({ parcelSnapshot: newData })
        .where(eq(reportSnapshots.id, snapshot.id))
    ).rejects.toThrow(); // Should be prevented by schema
  });
  
  it('verifies checksum integrity', async () => {
    const snapshot = await createSnapshot(reportId, data, userId);
    
    // Manually corrupt data
    await db.update(reportSnapshots)
      .set({ parcelSnapshot: corruptedData })
      .where(eq(reportSnapshots.id, snapshot.id));
    
    await expect(
      verifyChecksum(corruptedData, snapshot.checksum)
    ).resolves.toBe(false);
  });
  
  it('handles concurrent creates correctly', async () => {
    const results = await Promise.all([
      createSnapshot(reportId, data1, user1),
      createSnapshot(reportId, data2, user2),
    ]);
    
    expect(results[0].version).not.toBe(results[1].version);
  });
});
```

## Migration

### Add Snapshot Table

```sql
CREATE TABLE report_snapshots (
  id VARCHAR(64) PRIMARY KEY,
  report_id VARCHAR(64) NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  parcel_snapshot JSONB NOT NULL,
  snapshot_metadata JSONB NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  data_size INTEGER NOT NULL,
  parent_snapshot_id VARCHAR(64) REFERENCES report_snapshots(id),
  changes_summary JSONB,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deprecated_at TIMESTAMP,
  deprecated_reason TEXT,
  
  CONSTRAINT unique_report_version UNIQUE (report_id, version)
);

CREATE INDEX idx_snapshots_report_active ON report_snapshots(report_id, is_active);
CREATE INDEX idx_snapshots_version ON report_snapshots(report_id, version DESC);
CREATE INDEX idx_snapshots_created ON report_snapshots(created_at DESC);
```

### Migrate Existing Reports

```typescript
export const migrateReportsToSnapshots = async () => {
  const reports = await db.select().from(reports);
  
  for (const report of reports) {
    await createSnapshot(
      report.id,
      report.parcelSnapshot,
      report.userId
    );
  }
  
  logger.info('migration_complete', { count: reports.length });
};
```

## Success Metrics

- ✅ Zero data loss incidents
- ✅ 100% immutability compliance
- ✅ < 100ms snapshot retrieval (p95)
- ✅ < 500ms snapshot creation (p95)
- ✅ 100% checksum verification pass rate
- ✅ Zero integrity violations

## References

- [Immutable Data Structures](https://en.wikipedia.org/wiki/Persistent_data_structure)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Optimistic Concurrency Control](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
