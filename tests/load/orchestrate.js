/**
 * Load Test Orchestration Script
 * 
 * Runs all load tests with proper configuration and result aggregation.
 * 
 * Run with:
 *   npm run load-test                  # Run all tests
 *   npm run load-test:ccp03            # CCP-03 only
 *   npm run load-test:ccp04            # CCP-04 only
 *   npm run load-test:smoke            # Quick smoke test
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const WORKSPACE_ID = process.env.WORKSPACE_ID || 'workspace-test-001';
const USER_ID = process.env.USER_ID || 'user-test-001';
const REPORT_ID = process.env.REPORT_ID || 'report-test-001';

const resultsDir = join(process.cwd(), 'tests', 'load', 'results');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

// Create results directory
if (!existsSync(resultsDir)) {
  mkdirSync(resultsDir, { recursive: true });
}

// ============================================================================
// TEST DEFINITIONS
// ============================================================================

const tests = {
  ccp03: {
    name: 'CCP-03: Concurrent Report Creation',
    script: 'tests/load/ccp03_report_create.js',
    vus: 10,
    duration: '30s',
    stages: true,
  },
  ccp04: {
    name: 'CCP-04: Concurrent Snapshot Operations',
    script: 'tests/load/ccp04_snapshot_ops.js',
    vus: 15,
    duration: '45s',
    stages: true,
  },
  smoke: {
    name: 'Smoke Test (Quick Validation)',
    script: 'tests/load/ccp03_report_create.js',
    vus: 2,
    duration: '10s',
    stages: false,
  },
};

// ============================================================================
// RUN LOAD TEST
// ============================================================================

async function runLoadTest(testName) {
  const test = tests[testName];
  if (!test) {
    console.error(`Unknown test: ${testName}`);
    process.exit(1);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Starting: ${test.name}`);
  console.log(`${'='.repeat(70)}\n`);

  return new Promise((resolve, reject) => {
    const args = [
      'run',
      test.script,
      `--vus=${test.vus}`,
      `--duration=${test.duration}`,
      '--out=json=' + join(resultsDir, `${testName}-${timestamp}.json`),
    ];

    const env = {
      ...process.env,
      API_BASE,
      WORKSPACE_ID,
      USER_ID,
      REPORT_ID,
    };

    const k6 = spawn('k6', args, {
      stdio: 'inherit',
      env,
    });

    k6.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${test.name} completed successfully\n`);
        resolve(code);
      } else {
        console.error(`\n❌ ${test.name} failed with code ${code}\n`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });

    k6.on('error', reject);
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const testToRun = process.argv[2] || 'all';
  const testsToRun = testToRun === 'all' ? ['ccp03', 'ccp04'] : [testToRun];

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           LOAD TEST SUITE - CCP-03 & CCP-04                    ║
╚════════════════════════════════════════════════════════════════╝

Configuration:
  API Base:    ${API_BASE}
  Results:     ${resultsDir}
  Timestamp:   ${timestamp}
  `);

  let passed = 0;
  let failed = 0;

  for (const test of testsToRun) {
    try {
      await runLoadTest(test);
      passed++;
    } catch (error) {
      console.error(`Error running ${test}:`, error.message);
      failed++;
    }
  }

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     SUMMARY                                    ║
╚════════════════════════════════════════════════════════════════╝

Tests Passed:  ${passed}
Tests Failed:  ${failed}
Status:        ${failed === 0 ? '✅ ALL PASSED' : '❌ SOME FAILED'}

Results saved to: ${resultsDir}
  `);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
