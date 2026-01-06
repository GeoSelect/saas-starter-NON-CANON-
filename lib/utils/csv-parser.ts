// C103 CSV Contact Upload — deterministic CSV parser (CCP-09)
// Server-side only; validates all rows before returning

import type { CSVValidationResult, CSVValidationError, ValidatedCSVRow } from '@/lib/contracts/ccp09/csv-upload';
import { MAX_FILE_SIZE } from '@/lib/contracts/ccp09/csv-upload';

export async function parseAndValidateCSV(
  file: File,
  maxRows: number
): Promise<CSVValidationResult> {
  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      validRows: [],
      errors: [
        {
          lineNumber: 0,
          field: 'file',
          issue: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB, max 10MB)`,
        },
      ],
      summary: { totalRows: 0, validCount: 0, errorCount: 1, skipped: 0 },
    };
  }

  // 2. Check MIME type
  if (!file.type.includes('text/csv') && !file.name.endsWith('.csv')) {
    return {
      valid: false,
      validRows: [],
      errors: [
        {
          lineNumber: 0,
          field: 'file',
          issue: 'File must be CSV format',
        },
      ],
      summary: { totalRows: 0, validCount: 0, errorCount: 1, skipped: 0 },
    };
  }

  // 3. Parse CSV text
  const text = await file.text();
  const lines = text.split('\n');
  const headers = lines[0]?.split(',').map((h) => h.trim()) ?? [];

  const validRows: ValidatedCSVRow[] = [];
  const errors: CSVValidationError[] = [];

  // Validate headers
  const requiredHeaders = ['email', 'name'];
  const hasAllRequired = requiredHeaders.every((h) =>
    headers.map((hh) => hh.toLowerCase()).includes(h.toLowerCase())
  );

  if (!hasAllRequired) {
    return {
      valid: false,
      validRows: [],
      errors: [
        {
          lineNumber: 0,
          field: 'headers',
          issue: `Missing required columns: ${requiredHeaders.join(', ')}`,
        },
      ],
      summary: { totalRows: 0, validCount: 0, errorCount: 1, skipped: 0 },
    };
  }

  // Process rows
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]?.trim()) continue; // Skip empty lines

    if (validRows.length + errors.length >= maxRows) {
      errors.push({
        lineNumber: i + 1,
        field: 'file',
        issue: `Exceeded row limit (${maxRows} rows max)`,
      });
      break;
    }

    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, idx) => {
      row[header.toLowerCase()] = values[idx] ?? '';
    });

    // Validate required fields
    const email = row['email']?.trim();
    const name = row['name']?.trim();

    if (!email) {
      errors.push({
        lineNumber: i + 1,
        field: 'email',
        issue: 'Email is required',
      });
      continue;
    }

    if (!isValidEmail(email)) {
      errors.push({
        lineNumber: i + 1,
        field: 'email',
        issue: `Invalid email format: ${email}`,
        value: email,
      });
      continue;
    }

    if (!name) {
      errors.push({
        lineNumber: i + 1,
        field: 'name',
        issue: 'Name is required',
      });
      continue;
    }

    // Valid row
    validRows.push({
      lineNumber: i + 1,
      email,
      name,
      phone: row['phone']?.trim(),
      company: row['company']?.trim(),
      notes: row['notes']?.trim(),
    });
  }

  const valid = errors.length === 0;

  return {
    valid,
    validRows,
    errors,
    summary: {
      totalRows: lines.length - 1, // Exclude header
      validCount: validRows.length,
      errorCount: errors.length,
      skipped: 0,
    },
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}
