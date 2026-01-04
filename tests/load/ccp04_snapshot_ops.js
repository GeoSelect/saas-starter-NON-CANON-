/**
 * CCP-04 Load Test: Concurrent Snapshot Operations
 * 
 * Tests the integrity and performance of snapshot operations under load:
 * - Concurrent snapshot creation
 * - Snapshot immutability enforcement
 * - Version chain integrity
 * - Checksum validation
 * - Mutation rejection
 * - Rollback prevention
 * 
 * Run with:
 *   k6 run tests/load/ccp04_snapshot_ops.js
 * 
 * Options:
 *   --vus=15 --duration=45s          # 15 virtual users for 45 seconds
 *   --ramp-up                        # Gradually increase VUs
 *   --spike                          # Sudden traffic spike
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Histogram, Rate, Trend } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';

// ============================================================================
// CUSTOM METRICS
// ============================================================================

const snapshotCreatedCounter = new Counter('snapshots_created');
const snapshotErrorCounter = new Counter('snapshots_error');
const snapshotCreationTime = new Trend('snapshot_creation_time');
const mutationRejectionRate = new Rate('mutation_rejection_rate');
const checksumValidationTime = new Trend('checksum_validation_time');
const immutabilityEnforced = new Counter('immutability_enforced');
const versionChainIntegrity = new Counter('version_chain_integrity');

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = __ENV.API_BASE || 'http://localhost:3000';
const WORKSPACE_ID = __ENV.WORKSPACE_ID || 'workspace-test-001';
const USER_ID = __ENV.USER_ID || 'user-test-001';
const REPORT_ID = __ENV.REPORT_ID || 'report-test-001';

// Generate snapshot with deterministic data
function generateSnapshot(iteration) {
  const timestamp = new Date().toISOString();
  const snapshotData = {
    parcelId: `parcel-${iteration % 5}`,
    zoneIds: [`zone-${iteration % 3}`, `zone-${(iteration + 1) % 3}`],
    areaOverlapPercentage: 45.67 + (iteration % 10),
    timestamp: timestamp,
    metadata: {
      source: 'load-test',
      iteration: iteration,
      version: '0.1',
    },
  };
  
  return snapshotData;
}

// ============================================================================
// TEST OPTIONS
// ============================================================================

export const options = {
  // Ramping test: stress test for snapshot operations
  stages: [
    { duration: '5s', target: 5 },     // Ramp up to 5 VUs
    { duration: '15s', target: 15 },   // Ramp up to 15 VUs
    { duration: '20s', target: 15 },   // Hold at 15 VUs
    { duration: '10s', target: 25 },   // Spike to 25 VUs
    { duration: '5s', target: 0 },     // Ramp down to 0 VUs
  ],
  
  // Thresholds
  thresholds: {
    'http_req_duration': ['p(95)<600'],           // 95% of requests < 600ms
    'snapshot_creation_time': ['p(95)<400'],      // 95% of creations < 400ms
    'snapshots_created': ['count>30'],            // At least 30 snapshots
    'mutation_rejection_rate': ['rate>0.95'],     // 95%+ mutations rejected
    'immutability_enforced': ['count>25'],        // 25+ immutability checks
  },
};

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

export function setup() {
  console.log('=== CCP-04 Load Test: Snapshot Operations ===');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Workspace ID: ${WORKSPACE_ID}`);
  console.log(`Report ID: ${REPORT_ID}`);
  
  return { 
    startTime: new Date().toISOString(),
    snapshots: [], // Track created snapshots
  };
}

export function teardown(data) {
  console.log('=== CCP-04 Load Test: Complete ===');
  console.log(`Start Time: ${data.startTime}`);
  console.log(`End Time: ${new Date().toISOString()}`);
  console.log(`Snapshots Created: ${data.snapshots?.length || 0}`);
}

// ============================================================================
// MAIN TEST
// ============================================================================

export default function (data) {
  const iteration = __VU * 1000 + __ITER;
  const snapshotData = generateSnapshot(iteration);
  
  group('CCP-04: Create Snapshot', () => {
    const startTime = new Date().getTime();
    
    const createRes = http.post(
      `${API_BASE}/api/report/${REPORT_ID}/snapshot`,
      JSON.stringify(snapshotData),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Load-Test': 'true',
          'X-Iteration': iteration.toString(),
          'X-VU': __VU.toString(),
        },
        tags: {
          name: 'CreateSnapshot',
          group: 'CCP-04',
        },
      }
    );
    
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    snapshotCreationTime.add(duration);
    
    // ========================================================================
    // RESPONSE VALIDATION
    // ========================================================================
    
    const responseValid = check(createRes, {
      'status is 200': (r) => r.status === 200,
      'has Content-Type': (r) => r.headers['Content-Type'] !== undefined,
      'has ETag': (r) => r.headers['ETag'] !== undefined,
    });
    
    let snapshot = null;
    try {
      snapshot = createRes.json();
    } catch (e) {
      console.error(`Failed to parse snapshot response (iteration ${iteration}): ${e}`);
      snapshotErrorCounter.add(1);
      return;
    }
    
    // ========================================================================
    // CCP-04 CONTRACT: Snapshot structure validation
    // ========================================================================
    
    const contractChecks = check(snapshot, {
      // Required snapshot fields
      'has id': (obj) => obj && obj.id !== undefined,
      'has reportId': (obj) => obj && obj.reportId === REPORT_ID,
      'has checksum': (obj) => obj && obj.checksum !== undefined,
      'has version': (obj) => obj && obj.version !== undefined,
      'has createdAt': (obj) => obj && obj.createdAt !== undefined,
      
      // Version chain
      'has previousVersion': (obj) => obj && obj.previousVersion !== undefined,
      'version chain valid': (obj) => 
        obj && (obj.version === 1 || obj.previousVersion !== null),
      
      // Data integrity
      'has data': (obj) => obj && obj.data !== undefined,
      'data matches parcelId': (obj) => 
        obj && obj.data && obj.data.parcelId === snapshotData.parcelId,
      
      // Immutability markers
      'has immutable flag': (obj) => obj && obj.immutable !== undefined,
      'marked as immutable': (obj) => obj && obj.immutable === true,
    });
    
    if (!contractChecks) {
      snapshotErrorCounter.add(1);
      console.error(`Contract violation (iteration ${iteration}):`, snapshot);
      return;
    }
    
    snapshotCreatedCounter.add(1);
    
    // Store snapshot for mutation test
    if (!data.snapshots) data.snapshots = [];
    data.snapshots.push({
      id: snapshot.id,
      reportId: REPORT_ID,
      version: snapshot.version,
      checksum: snapshot.checksum,
    });
  });
  
  // ========================================================================
  // CCP-04 TEST: Snapshot Immutability
  // ========================================================================
  
  group('CCP-04: Test Immutability', () => {
    if (!data.snapshots || data.snapshots.length === 0) {
      return; // No snapshots to test yet
    }
    
    // Pick random snapshot from earlier iterations
    const snapshotIdx = Math.floor(Math.random() * data.snapshots.length);
    const targetSnapshot = data.snapshots[snapshotIdx];
    
    const mutationPayload = {
      ...generateSnapshot(iteration),
      areaOverlapPercentage: 99.99, // Try to change
    };
    
    const mutationRes = http.put(
      `${API_BASE}/api/report/${REPORT_ID}/snapshot/${targetSnapshot.id}`,
      JSON.stringify(mutationPayload),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'AttemptMutation' },
      }
    );
    
    const mutationRejected = check(mutationRes, {
      'mutation is rejected': (r) => r.status !== 200,
      'status is 409 Conflict': (r) => r.status === 409,
      'mutation blocked': (r) => r.status >= 400,
    });
    
    if (mutationRejected) {
      mutationRejectionRate.add(1);
      immutabilityEnforced.add(1);
    } else {
      mutationRejectionRate.add(0);
      console.error(`Immutability violation for snapshot ${targetSnapshot.id}`);
    }
  });
  
  // ========================================================================
  // CCP-04 TEST: Checksum Validation
  // ========================================================================
  
  group('CCP-04: Validate Checksum', () => {
    if (!data.snapshots || data.snapshots.length === 0) {
      return;
    }
    
    const snapshotIdx = Math.floor(Math.random() * data.snapshots.length);
    const targetSnapshot = data.snapshots[snapshotIdx];
    
    const startTime = new Date().getTime();
    
    const checksumRes = http.get(
      `${API_BASE}/api/report/${REPORT_ID}/snapshot/${targetSnapshot.id}/verify`,
      {
        tags: { name: 'VerifyChecksum' },
      }
    );
    
    const endTime = new Date().getTime();
    checksumValidationTime.add(endTime - startTime);
    
    check(checksumRes, {
      'checksum verification succeeds': (r) => r.status === 200,
      'checksum is valid': (r) => {
        try {
          const body = r.json();
          return body && body.valid === true;
        } catch {
          return false;
        }
      },
    });
  });
  
  // ========================================================================
  // CCP-04 TEST: Version Chain Integrity
  // ========================================================================
  
  group('CCP-04: Verify Version Chain', () => {
    if (!data.snapshots || data.snapshots.length < 2) {
      return; // Need at least 2 snapshots
    }
    
    const getRes = http.get(
      `${API_BASE}/api/report/${REPORT_ID}/snapshots`,
      {
        tags: { name: 'GetVersionChain' },
      }
    );
    
    check(getRes, {
      'version chain retrieval succeeds': (r) => r.status === 200,
      'returns array': (r) => {
        try {
          const body = r.json();
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
    });
    
    try {
      const snapshots = getRes.json();
      if (Array.isArray(snapshots) && snapshots.length > 0) {
        // Verify versions are in order
        let validChain = true;
        for (let i = 1; i < snapshots.length; i++) {
          if (snapshots[i].version !== snapshots[i - 1].version + 1) {
            validChain = false;
            break;
          }
        }
        
        if (validChain) {
          versionChainIntegrity.add(1);
        }
      }
    } catch (e) {
      console.error(`Version chain validation error: ${e}`);
    }
  });
  
  // ========================================================================
  // CCP-04 TEST: Rollback Prevention
  // ========================================================================
  
  group('CCP-04: Prevent Rollback', () => {
    if (!data.snapshots || data.snapshots.length < 2) {
      return;
    }
    
    const targetSnapshot = data.snapshots[0]; // Try to rollback to first
    
    const rollbackRes = http.post(
      `${API_BASE}/api/report/${REPORT_ID}/snapshot/${targetSnapshot.id}/rollback`,
      null,
      {
        tags: { name: 'AttemptRollback' },
      }
    );
    
    check(rollbackRes, {
      'rollback is rejected': (r) => r.status !== 200,
      'status is 403 or 409': (r) => r.status === 403 || r.status === 409,
    });
  });
  
  // Random sleep
  sleep(Math.random() * 1 + 0.5);
}

// ============================================================================
// SUMMARY
// ============================================================================

export function handleSummary(data) {
  return {
    'stdout': summaryText(data),
    './results.json': JSON.stringify(data),
  };
}

function summaryText(data) {
  return `
╔════════════════════════════════════════════════════════════════╗
║      CCP-04 Load Test: Concurrent Snapshot Operations           ║
╚════════════════════════════════════════════════════════════════╝

📸 SNAPSHOT METRICS
──────────────────────────────────────────────────────────────────
Snapshots Created:      ${data.metrics.snapshots_created?.value || 0}
Snapshots Failed:       ${data.metrics.snapshots_error?.value || 0}
Immutability Enforced:  ${data.metrics.immutability_enforced?.value || 0}
Version Chain Valid:    ${data.metrics.version_chain_integrity?.value || 0}

⏱️  TIMING METRICS
──────────────────────────────────────────────────────────────────
Creation Time (avg):    ${(data.metrics.snapshot_creation_time?.values?.avg || 0).toFixed(2)}ms
Creation Time (p95):    ${(data.metrics.snapshot_creation_time?.values?.['p(95)'] || 0).toFixed(2)}ms
Checksum Validation:    ${(data.metrics.checksum_validation_time?.values?.avg || 0).toFixed(2)}ms

🛡️  PROTECTION METRICS
──────────────────────────────────────────────────────────────────
Mutations Rejected:     ${((data.metrics.mutation_rejection_rate?.value || 0) * 100).toFixed(2)}%
Immutable Enforcement:  ${data.metrics.immutability_enforced?.value || 0} enforcements

✅ TEST RESULT: ${(data.metrics.snapshots_created?.value > 30 && (data.metrics.mutation_rejection_rate?.value || 0) > 0.95) ? 'PASSED' : 'FAILED'}
──────────────────────────────────────────────────────────────────
  `;
}
