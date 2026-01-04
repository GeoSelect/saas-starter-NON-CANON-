/**
 * CCP-03 Load Test: Concurrent Report Creation
 * 
 * Tests the integrity and performance of report creation under load:
 * - Concurrent users creating reports
 * - Response contract validation (rpt-0.1 JSON structure)
 * - Transaction atomicity (no partial writes)
 * - Error rate and latency under load
 * - Immutable snapshot prevention
 * 
 * Run with:
 *   k6 run tests/load/ccp03_report_create.js
 * 
 * Options:
 *   --vus=10 --duration=30s          # 10 virtual users for 30 seconds
 *   --ramp-up                        # Gradually increase VUs
 *   --spike                          # Sudden traffic spike
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Histogram, Rate, Trend } from 'k6/metrics';

// ============================================================================
// CUSTOM METRICS
// ============================================================================

const reportCreatedCounter = new Counter('reports_created');
const reportErrorCounter = new Counter('reports_error');
const reportCreationTime = new Trend('report_creation_time');
const reportErrorRate = new Rate('report_error_rate');
const atomicityFailures = new Counter('atomicity_failures');

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = __ENV.API_BASE || 'http://localhost:3000';
const WORKSPACE_ID = __ENV.WORKSPACE_ID || 'workspace-test-001';
const USER_ID = __ENV.USER_ID || 'user-test-001';

// Mock report payload (matches CCP-03 contract)
function generateReportPayload(iteration) {
  return {
    workspaceId: WORKSPACE_ID,
    userId: USER_ID,
    title: `Load Test Report ${iteration} - ${new Date().toISOString()}`,
    description: 'Auto-generated report for concurrent load testing',
    parcelSnapshot: {
      id: `snap-${iteration}-${Date.now()}`,
      parcelId: `parcel-${iteration % 10}`,
      zoneIds: ['zone-A', 'zone-B'],
      areaOverlapPercentage: 45.67 + iteration,
      timestamp: new Date().toISOString(),
    },
    metadata: {
      source: 'load-test',
      iteration: iteration,
      version: '0.1',
    },
  };
}

// ============================================================================
// TEST OPTIONS
// ============================================================================

export const options = {
  // Ramping test: gradually increase load
  stages: [
    { duration: '5s', target: 5 },    // Ramp up to 5 VUs
    { duration: '10s', target: 10 },   // Ramp up to 10 VUs
    { duration: '20s', target: 10 },   // Hold at 10 VUs
    { duration: '5s', target: 0 },     // Ramp down to 0 VUs
  ],
  
  // Threshold - fail test if these are violated
  thresholds: {
    'http_req_duration': ['p(95)<500'],           // 95% of requests < 500ms
    'http_req_duration{staticAsset:yes}': ['p(99)<1000'],
    'report_error_rate': ['rate<0.1'],            // Error rate < 10%
    'reports_created': ['count>15'],              // At least 15 reports created
  },
  
  // Extended output
  ext: {
    loadimpact: {
      projectID: 3500516,
      name: 'CCP-03 Concurrent Report Creation',
    },
  },
};

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

export function setup() {
  console.log('=== CCP-03 Load Test: Starting ===');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Workspace ID: ${WORKSPACE_ID}`);
  console.log(`User ID: ${USER_ID}`);
  
  // Warm-up request
  const warmupPayload = generateReportPayload(0);
  const warmupRes = http.post(
    `${API_BASE}/api/report/create`,
    JSON.stringify(warmupPayload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  console.log(`Warm-up response status: ${warmupRes.status}`);
  
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('=== CCP-03 Load Test: Complete ===');
  console.log(`Start Time: ${data.startTime}`);
  console.log(`End Time: ${new Date().toISOString()}`);
}

// ============================================================================
// MAIN TEST
// ============================================================================

export default function (data) {
  const iteration = __VU * 1000 + __ITER;
  const payload = generateReportPayload(iteration);
  
  group('CCP-03: Create Report', () => {
    // Measure report creation time
    const startTime = new Date().getTime();
    
    const res = http.post(
      `${API_BASE}/api/report/create`,
      JSON.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Load-Test': 'true',
          'X-Iteration': iteration.toString(),
          'X-VU': __VU.toString(),
        },
        tags: {
          name: 'CreateReport',
          group: 'CCP-03',
        },
      }
    );
    
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    reportCreationTime.add(duration);
    
    // ========================================================================
    // RESPONSE CONTRACT VALIDATION (rpt-0.1 JSON structure)
    // ========================================================================
    
    const contractValid = check(res, {
      // HTTP Status
      'status is 200': (r) => r.status === 200,
      'status is not 4xx error': (r) => r.status < 400,
      'status is not 5xx error': (r) => r.status < 500,
      
      // Response headers
      'has Content-Type': (r) => r.headers['Content-Type'] !== undefined,
      'has ETag (immutable)': (r) => r.headers['ETag'] !== undefined,
      'has Cache-Control': (r) => r.headers['Cache-Control'] !== undefined,
    });
    
    // Parse JSON response
    let reportJson = null;
    try {
      reportJson = res.json();
    } catch (e) {
      console.error(`Failed to parse JSON response (iteration ${iteration}): ${e}`);
      reportErrorCounter.add(1);
      reportErrorRate.add(1);
      return;
    }
    
    // ========================================================================
    // CCP-03 CONTRACT: Response structure validation
    // ========================================================================
    
    const contractChecks = check(reportJson, {
      // Required top-level fields
      'has id field': (obj) => obj && obj.id !== undefined,
      'has workspaceId': (obj) => obj && obj.workspaceId === WORKSPACE_ID,
      'has userId': (obj) => obj && obj.userId === USER_ID,
      'has title': (obj) => obj && obj.title !== undefined,
      'has createdAt': (obj) => obj && obj.createdAt !== undefined,
      'has reportVersion': (obj) => obj && obj.reportVersion !== undefined,
      
      // Immutable snapshot
      'has immutableSnapshot': (obj) => obj && obj.immutableSnapshot !== undefined,
      'snapshot has id': (obj) => obj && obj.immutableSnapshot && obj.immutableSnapshot.id !== undefined,
      'snapshot has checksum': (obj) => obj && obj.immutableSnapshot && obj.immutableSnapshot.checksum !== undefined,
      'snapshot has version': (obj) => obj && obj.immutableSnapshot && obj.immutableSnapshot.version !== undefined,
      
      // Parcel snapshot
      'has parcelSnapshot': (obj) => obj && obj.parcelSnapshot !== undefined,
      'parcelSnapshot has id': (obj) => obj && obj.parcelSnapshot && obj.parcelSnapshot.id !== undefined,
      'parcelSnapshot has parcelId': (obj) => obj && obj.parcelSnapshot && obj.parcelSnapshot.parcelId !== undefined,
      
      // Metadata
      'has metadata': (obj) => obj && obj.metadata !== undefined,
      
      // Version match (rpt-0.1)
      'reportVersion is 0.1': (obj) => obj && obj.reportVersion === '0.1',
    });
    
    if (!contractValid || !contractChecks) {
      reportErrorCounter.add(1);
      reportErrorRate.add(1);
      console.error(`Contract violation (iteration ${iteration}):`, reportJson);
    } else {
      reportCreatedCounter.add(1);
      reportErrorRate.add(0);
    }
    
    // ========================================================================
    // TRANSACTION ATOMICITY CHECK
    // ========================================================================
    
    const atomicityChecks = check(reportJson, {
      // If creation succeeded, all fields should be present (no partial write)
      'created snapshot exists': (obj) => 
        res.status === 200 ? obj && obj.immutableSnapshot !== undefined : true,
      
      'snapshot has all required fields': (obj) =>
        res.status === 200 ? (
          obj && 
          obj.immutableSnapshot &&
          obj.immutableSnapshot.id &&
          obj.immutableSnapshot.checksum &&
          obj.immutableSnapshot.version
        ) : true,
      
      'parcelSnapshot matches input': (obj) =>
        res.status === 200 ? (
          obj && 
          obj.parcelSnapshot &&
          obj.parcelSnapshot.parcelId === payload.parcelSnapshot.parcelId
        ) : true,
    });
    
    if (!atomicityChecks && res.status === 200) {
      atomicityFailures.add(1);
      console.error(`Atomicity violation (iteration ${iteration}):`, reportJson);
    }
    
    // ========================================================================
    // PERFORMANCE METRICS
    // ========================================================================
    
    check(res, {
      'creation time < 100ms': () => duration < 100,
      'creation time < 300ms': () => duration < 300,
      'creation time < 500ms': () => duration < 500,
    });
    
    // ========================================================================
    // SNAPSHOT IMMUTABILITY CHECK
    // ========================================================================
    
    if (reportJson && reportJson.immutableSnapshot) {
      const snapshotId = reportJson.immutableSnapshot.id;
      
      // Try to update snapshot (should fail)
      const updateRes = http.put(
        `${API_BASE}/api/report/${reportJson.id}/snapshot`,
        JSON.stringify({
          snapshotId: snapshotId,
          parcelSnapshot: {
            ...payload.parcelSnapshot,
            areaOverlapPercentage: 99.99, // Try to change
          },
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'UpdateSnapshot' },
        }
      );
      
      check(updateRes, {
        'snapshot update is rejected': (r) => r.status === 409 || r.status === 403,
        'snapshot is immutable': (r) => r.status !== 200,
      });
    }
  });
  
  // Random sleep between 1-3 seconds (simulate real user)
  sleep(Math.random() * 2 + 1);
}

// ============================================================================
// CUSTOM CHECKS: Distributed Load Patterns
// ============================================================================

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    './results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const summary = `
╔════════════════════════════════════════════════════════════════╗
║         CCP-03 Load Test: Concurrent Report Creation            ║
╚════════════════════════════════════════════════════════════════╝

📊 METRICS SUMMARY
──────────────────────────────────────────────────────────────────
Reports Created:        ${data.metrics.reports_created?.value || 0}
Reports Failed:         ${data.metrics.reports_error?.value || 0}
Atomicity Failures:     ${data.metrics.atomicity_failures?.value || 0}

⏱️  TIMING METRICS
──────────────────────────────────────────────────────────────────
Creation Time (avg):    ${(data.metrics.report_creation_time?.values?.avg || 0).toFixed(2)}ms
Creation Time (p95):    ${(data.metrics.report_creation_time?.values?.['p(95)'] || 0).toFixed(2)}ms
Creation Time (p99):    ${(data.metrics.report_creation_time?.values?.['p(99)'] || 0).toFixed(2)}ms

📈 ERROR METRICS
──────────────────────────────────────────────────────────────────
Error Rate:             ${((data.metrics.report_error_rate?.value || 0) * 100).toFixed(2)}%
HTTP Errors:            ${data.metrics.http_reqs?.fails || 0}

✅ TEST RESULT: ${data.metrics.reports_created?.value > 15 && (data.metrics.report_error_rate?.value || 0) < 0.1 ? 'PASSED' : 'FAILED'}
──────────────────────────────────────────────────────────────────
  `;
  
  return summary;
}
