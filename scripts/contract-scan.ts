// C001 AppShell — build-time contract validation (CCP-00)
// Scans codebase for forbidden direct imports that violate AppShell contract.

import fs from 'fs';
import path from 'path';

const FORBIDDEN_PATTERNS = [
  /import\s+.*from\s+['"]@\/lib\/db\/queries['"]/,
  /import\s+.*from\s+['"]@\/lib\/payments\/queries['"]/,
  /from\s+['"]@\/lib\/api\/workspace['"]/,
];

const WHITELIST_PATHS = [
  'lib/context/',
  'lib/hooks/',
  'lib/contracts/',
  'lib/components/EntitlementGate',
  'docs/',
  'node_modules/',
  'scripts/',
  'tests/',
  'e2e/',
];

interface ScanResult {
  filePath: string;
  line: number;
  pattern: string;
  content: string;
}

function shouldScan(filePath: string): boolean {
  const isWhitelisted = WHITELIST_PATHS.some((pattern) =>
    filePath.includes(pattern)
  );
  return !isWhitelisted;
}

function scanFile(filePath: string): ScanResult[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const results: ScanResult[] = [];
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      FORBIDDEN_PATTERNS.forEach((pattern) => {
        if (pattern.test(line)) {
          results.push({
            filePath,
            line: idx + 1,
            pattern: pattern.source,
            content: line.trim(),
          });
        }
      });
    });

    return results;
  } catch (err) {
    return [];
  }
}

function scanDir(dir: string): ScanResult[] {
  const results: ScanResult[] = [];
  const files = fs.readdirSync(dir, { recursive: true });

  files.forEach((file) => {
    if (typeof file === 'string') {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
        if (shouldScan(filePath)) {
          results.push(...scanFile(filePath));
        }
      }
    }
  });

  return results;
}

// Main execution
try {
  const violations = scanDir('app');

  if (violations.length > 0) {
    console.error(
      '\n❌ C001 AppShell — Contract Violations Found:\n'
    );
    violations.forEach((v) => {
      console.error(
        `  ${v.filePath}:${v.line}\n    Pattern: ${v.pattern}\n    > ${v.content}\n`
      );
    });
    console.error(
      `\n🚨 ${violations.length} violation(s) found. Use useAppShell() hook instead.\n`
    );
    process.exit(1);
  } else {
    console.log(
      '✅ C001 AppShell — All contracts validated (no forbidden imports detected)'
    );
    process.exit(0);
  }
} catch (err) {
  console.error('Error during contract scan:', err);
  process.exit(1);
}
