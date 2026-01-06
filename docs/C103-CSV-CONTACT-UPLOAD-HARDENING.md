# C103 CSV Contact Upload — Hardening Task Template (CCP-09, CCP-07)

**Component:** C103 CSVContactUpload  
**CCPs:** CCP-09 (CRM Integration), CCP-07 (Audit & Compliance)  
**Status:** 🚨 Must Have (Blocking CRM)  
**Priority:** CRITICAL (data import enforcement)  
**Dependencies:** C001 AppShell (entitlements), C046 UnlockDetails (paywall gate)

---

## Goal

Build a deterministic, validated CSV contact upload system that enforces:
- **File validation**: CSV format, schema validation, size/row limits
- **Error handling**: Recovery from malformed rows, partial success reporting
- **Audit trail**: Complete logging of upload attempts, successes, failures for compliance
- **No bypass**: Server-side validation; client cannot circumvent checks

C103 is the **data ingestion enforcer** for CRM features: when users import contacts, every action is validated and logged.

---

## Acceptance Criteria (Machine-Checkable)

1. **CSV format validated:** Only `.csv` files accepted; mime-type checked on server
2. **Schema enforced:** Required columns (email, name) + optional (phone, company, notes); invalid rows rejected
3. **Row limits:** Max 5,000 rows per upload; free/pro users capped lower
4. **File size limits:** Max 10MB; enforced server-side
5. **Audit trail immutable:** Every upload (success/fail) logged to `contact_uploads` table (append-only)
6. **Partial success:** If some rows fail validation, report which ones + allow continue with valid rows
7. **Row-level errors:** Parse errors include line number + specific field issue
8. **RLS enforcement:** Users can only access their workspace's uploads
9. **Tier gating:** Pro+ CRM minimum for CSV upload; free/pro users blocked by C046
10. **CI gating:** Build fails if:
    - CSV parser doesn't validate MIME type
    - Server doesn't enforce row/file size limits
    - Audit logs missing on upload attempt
    - Invalid rows allowed through schema validation
    - RLS policies missing on `contact_uploads` table

---

## Invariants (Must Always Be True)

- `validateCSV(file) → ValidationResult` — pure function, deterministic
- If file size > 10MB, reject immediately before parsing
- If row count > tier-based limit, reject entire upload
- All rows validated before any inserts to `contacts` table (all-or-nothing atomicity)
- `contact_uploads` rows are immutable (append-only); no deletes or updates
- Session auth is canonical; client cannot fake import source
- RLS policies on `contacts` and `contact_uploads` prevent cross-workspace access
- Error messages include: line number, field name, reason (not just "error")

---

## Tactical Engineering Tasks (Ordered)

### Phase 1: Contracts & Types

#### Task 1.1: Create CSV upload contract
**File:** `lib/contracts/ccp09/csv-upload.ts`

```typescript
// C103 CSV Contact Upload — upload state contract (CCP-09, CCP-07)

export interface CSVRow {
  lineNumber: number;
  data: Record<string, string>;
}

export interface ValidatedCSVRow {
  lineNumber: number;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  notes?: string;
}

export interface CSVValidationError {
  lineNumber: number;
  field: string;
  issue: string;
  value?: string;
}

export interface CSVValidationResult {
  valid: boolean;
  validRows: ValidatedCSVRow[];
  errors: CSVValidationError[];
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
    skipped: number;
  };
}

export interface ContactUploadLog {
  id: string; // UUID
  userId: string;
  workspaceId: string;
  fileName: string;
  fileSize: number;
  status: 'success' | 'partial' | 'failed';
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: CSVValidationError[];
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ROWS_ENTERPRISE = 50_000;
export const MAX_ROWS_PORTFOLIO = 20_000;
export const MAX_ROWS_PRO_PLUS = 5_000;
export const MAX_ROWS_PRO = 1_000;
export const MAX_ROWS_FREE = 100; // Free tier very limited

export function isValidatedCSVRow(row: unknown): row is ValidatedCSVRow {
  return (
    typeof row === 'object' &&
    row !== null &&
    'email' in row &&
    'name' in row
  );
}
```

#### Task 1.2: Create CSV parsing utility
**File:** `lib/utils/csv-parser.ts`

```typescript
// C103 CSV Contact Upload — deterministic CSV parser (CCP-09)
// Server-side only; validates all rows before returning

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
```

#### Task 1.3: Create audit contract
**File:** `lib/contracts/ccp09/upload-audit.ts`

```typescript
// C103 CSV Contact Upload — audit contract (CCP-09, CCP-07)

export interface ContactUploadAuditEvent {
  userId: string;
  workspaceId: string;
  fileName: string;
  fileSize: number;
  status: 'success' | 'partial' | 'failed';
  totalRows: number;
  validRows: number;
  errorRows: number;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Log contact upload attempt (success or failure).
 * Server-side only; never expose to client.
 */
export async function auditContactUpload(
  event: ContactUploadAuditEvent
): Promise<void> {
  // TODO: Insert into contact_uploads table
  // Server-side function only; never expose to client
}
```

### Phase 2: Components & Hooks

#### Task 2.1: Create upload component
**File:** `lib/components/C103-CSVContactUpload.tsx`

```typescript
// C103 CSV Contact Upload — upload UI component (CCP-09, CCP-07)
'use client';

import React, { useRef, useState } from 'react';
import { useAppShell } from '@/lib/hooks/useAppShell';
import { useContactAudit } from '@/lib/hooks/useContactAudit';
import type { CSVValidationResult, CSVValidationError } from '@/lib/contracts/ccp09/csv-upload';
import { Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react';

interface CSVContactUploadProps {
  onSuccess?: (rowCount: number) => void;
  onError?: (message: string) => void;
}

/**
 * C103 CSVContactUpload: deterministic contact import UI.
 * Validates CSV, shows errors, logs to audit trail.
 * Server-authoritative: client cannot bypass validation.
 */
export function CSVContactUpload({ onSuccess, onError }: CSVContactUploadProps) {
  const appShell = useAppShell();
  const { auditUpload } = useContactAudit();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CSVValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !appShell.workspace) {
      setError('No file selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `/api/workspaces/${appShell.workspace.id}/contacts/import`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data.result);

      // Audit the upload
      await auditUpload({
        fileName: file.name,
        fileSize: file.size,
        status: data.result.valid ? 'success' : 'partial',
        totalRows: data.result.summary.totalRows,
        validRows: data.result.summary.validCount,
        errorRows: data.result.summary.errorCount,
      });

      if (data.result.valid) {
        onSuccess?.(data.result.summary.validCount);
      } else if (data.result.summary.validCount > 0) {
        onSuccess?.(data.result.summary.validCount);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      {!result ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Contacts
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV file with your contacts (email, name, phone, company, notes)
          </p>

          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <FileText className="h-5 w-5 text-blue-600 inline mr-2" />
              <span className="text-sm text-blue-900">{file.name}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 inline mr-2" />
              <span className="text-sm text-red-900">{error}</span>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Choose File
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </>
      ) : (
        <UploadResult result={result} onReset={() => setResult(null)} />
      )}
    </div>
  );
}

function UploadResult({
  result,
  onReset,
}: {
  result: CSVValidationResult;
  onReset: () => void;
}) {
  const { summary, errors, valid } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-3">
        {valid ? (
          <CheckCircle className="h-8 w-8 text-green-600" />
        ) : (
          <AlertCircle className="h-8 w-8 text-amber-600" />
        )}
        <h3 className="text-lg font-semibold">
          {valid ? 'Upload successful' : 'Upload completed with errors'}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{summary.totalRows}</div>
          <p className="text-sm text-gray-600">Total rows</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{summary.validCount}</div>
          <p className="text-sm text-gray-600">Valid</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{summary.errorCount}</div>
          <p className="text-sm text-gray-600">Errors</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <h4 className="font-semibold text-red-900 mb-3">Errors:</h4>
          <ul className="space-y-2">
            {errors.slice(0, 10).map((err, idx) => (
              <li key={idx} className="text-sm text-red-700">
                <strong>Line {err.lineNumber}</strong> ({err.field}): {err.issue}
                {err.value && ` — "${err.value}"`}
              </li>
            ))}
            {errors.length > 10 && (
              <li className="text-sm text-red-700 italic">
                ... and {errors.length - 10} more errors
              </li>
            )}
          </ul>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold"
      >
        Upload Another File
      </button>
    </div>
  );
}
```

#### Task 2.2: Create audit hook
**File:** `lib/hooks/useContactAudit.ts`

```typescript
// C103 CSV Contact Upload — audit hook (CCP-09, CCP-07)
import { useCallback } from 'react';

interface UploadAuditEvent {
  fileName: string;
  fileSize: number;
  status: 'success' | 'partial' | 'failed';
  totalRows: number;
  validRows: number;
  errorRows: number;
}

/**
 * Hook: log contact upload attempts.
 * Used by C103 to create audit trail for compliance (CCP-07).
 */
export function useContactAudit() {
  const auditUpload = useCallback(
    async (event: UploadAuditEvent): Promise<void> => {
      try {
        await fetch('/api/audit/contact-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          credentials: 'include',
        });
      } catch (err) {
        console.warn('[C103] Failed to audit upload:', err);
        // Do not throw; audit is best-effort
      }
    },
    []
  );

  return { auditUpload };
}
```

### Phase 3: API Routes

#### Task 3.1: Create CSV import endpoint
**File:** `app/api/workspaces/[workspace_id]/contacts/import/route.ts`

```typescript
// C103 CSV Contact Upload — import endpoint (CCP-09, CCP-07)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { parseAndValidateCSV } from '@/lib/utils/csv-parser';
import type { CSVValidationResult } from '@/lib/contracts/ccp09/csv-upload';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspace_id: string }> }
) {
  const { workspace_id } = await params;

  try {
    // C103: Get authenticated user
    const cookieStore = req.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Determine max rows by tier
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('tier')
      .eq('id', workspace_id)
      .eq('owner_id', user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 403 });
    }

    const maxRows = getTierRowLimit(workspace.tier);

    // C103: Validate CSV (server-authoritative)
    const result = await parseAndValidateCSV(file, maxRows);

    // If partial success, insert valid rows
    if (result.validRows.length > 0) {
      await supabase.from('contacts').insert(
        result.validRows.map((row) => ({
          workspace_id,
          email: row.email,
          name: row.name,
          phone: row.phone || null,
          company: row.company || null,
          notes: row.notes || null,
        }))
      );
    }

    return NextResponse.json({ result }, { status: 200 });
  } catch (err) {
    console.error('[C103] Import error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getTierRowLimit(tier: string): number {
  const limits: Record<string, number> = {
    free: 100,
    pro: 1000,
    'pro-plus': 5000,
    portfolio: 20000,
    enterprise: 50000,
  };
  return limits[tier] ?? 1000;
}
```

#### Task 3.2: Create audit endpoint
**File:** `app/api/audit/contact-upload/route.ts`

```typescript
// C103 CSV Contact Upload — audit endpoint (CCP-09, CCP-07)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = req.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ status: 'ok' }, { status: 200 }); // best-effort
    }

    const {
      fileName,
      fileSize,
      status,
      totalRows,
      validRows,
      errorRows,
    } = await req.json();

    // C103 + C007: Insert audit log (append-only)
    await supabase.from('contact_uploads').insert({
      user_id: user.id,
      file_name: fileName,
      file_size: fileSize,
      status,
      total_rows: totalRows,
      valid_rows: validRows,
      error_rows: errorRows,
      user_agent: req.headers.get('user-agent'),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    console.warn('[C103] Audit error:', err);
    return NextResponse.json({ status: 'ok' }, { status: 200 }); // best-effort
  }
}
```

### Phase 4: Database Schema & RLS

#### Task 4.1: Add contact_uploads table migration
**File:** `supabase/migrations/20260106_add_contact_uploads.sql`

```sql
-- C103 CSV Contact Upload — audit table (CCP-09, CCP-07)

CREATE TABLE IF NOT EXISTS contact_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'success', -- success, partial, failed
  total_rows INTEGER NOT NULL,
  valid_rows INTEGER NOT NULL,
  error_rows INTEGER NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_contact_uploads_user_id 
  ON contact_uploads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_uploads_workspace_id 
  ON contact_uploads(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_uploads_status 
  ON contact_uploads(status, created_at DESC);

-- RLS: users can only query their own uploads
ALTER TABLE contact_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own contact uploads" ON contact_uploads;
CREATE POLICY "Users can view their own contact uploads" 
  ON contact_uploads FOR SELECT 
  USING (auth.uid() = user_id);

-- Audit table: append-only
DROP POLICY IF EXISTS "Contact uploads are append-only" ON contact_uploads;
CREATE POLICY "Contact uploads are append-only" 
  ON contact_uploads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

#### Task 4.2: Alter contacts table for upload tracking
**File:** `supabase/migrations/20260106_alter_contacts_for_uploads.sql`

```sql
-- C103 CSV Contact Upload — track upload source

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS 
  upload_id UUID REFERENCES contact_uploads(id) ON DELETE SET NULL;

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS 
  uploaded_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_contacts_upload_id 
  ON contacts(upload_id);
```

### Phase 5: Tests

#### Task 5.1: Unit tests
**File:** `tests/components/C103-CSVContactUpload.test.tsx`

```typescript
// C103 CSV Contact Upload — unit tests (CCP-09, CCP-07)
import { render, screen, waitFor } from '@testing-library/react';
import { CSVContactUpload } from '@/lib/components/C103-CSVContactUpload';

describe('C103 CSVContactUpload', () => {
  it('renders upload UI', () => {
    render(<CSVContactUpload />);
    expect(screen.getByText('Upload Contacts')).toBeInTheDocument();
  });

  it('validates CSV format', async () => {
    // Test file type validation
    // Expect: only .csv files accepted
  });

  it('rejects files > 10MB', async () => {
    // Test file size limit
  });

  it('validates required columns', async () => {
    // Test: email and name required
  });

  it('reports row-level errors with line numbers', async () => {
    // Test: invalid email on line 5 → specific error
  });

  it('allows partial success', async () => {
    // Test: 3 valid rows + 2 errors → import valid rows, report errors
  });

  it('audits upload attempt', async () => {
    // Verify audit trail created
  });
});
```

#### Task 5.2: E2E tests
**File:** `e2e/c103-csv-contact-upload.spec.ts`

```typescript
// C103 CSV Contact Upload — E2E tests (CCP-09, CCP-07)
import { test, expect } from '@playwright/test';

test.describe('C103 CSVContactUpload', () => {
  test('@c103: free user cannot upload (paywall)', async ({ page }) => {
    // Free user attempts upload
    // Expected: C046 UnlockDetails blocks, shows upgrade prompt
  });

  test('@c103: pro-plus user can upload valid CSV', async ({ page }) => {
    // Upload valid CSV
    // Expected: success message + row count
  });

  test('@c103: invalid email reported with line number', async ({
    page,
  }) => {
    // Upload CSV with invalid email on line 5
    // Expected: error message shows "Line 5: Invalid email format"
  });

  test('@c103: file > 10MB rejected', async ({ page }) => {
    // Upload 15MB file
    // Expected: error before parsing
  });

  test('@c103: partial success shows stats', async ({ page }) => {
    // Upload with 8 valid + 2 invalid rows
    // Expected: "8 valid, 2 errors" summary
  });

  test('@c103: upload audit trail created', async ({ page }) => {
    // Admin queries contact_uploads table
    // Expected: entry exists with correct counts
  });
});
```

### Phase 6: CI Integration

#### Task 6.1: CI workflow
**File:** `.github/workflows/ccp-09-contact-upload-checks.yml`

```yaml
name: CCP-09 CSV Contact Upload Validation

on:
  pull_request:
    paths:
      - 'lib/contracts/ccp09/**'
      - 'lib/components/C103-CSVContactUpload.tsx'
      - 'lib/utils/csv-parser.ts'
      - 'lib/hooks/useContactAudit.ts'
      - 'app/api/workspaces/*/contacts/import/**'
      - 'app/api/audit/contact-upload/**'
      - 'tests/components/C103-CSVContactUpload.test.tsx'
      - 'e2e/c103-csv-contact-upload.spec.ts'
      - '.github/workflows/ccp-09-contact-upload-checks.yml'

jobs:
  csv-validation:
    name: C103 CSV Parser Validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- tests/utils/csv-parser.test.ts

  unit-tests:
    name: C103 Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- tests/components/C103-CSVContactUpload.test.tsx

  e2e-upload:
    name: C103 E2E Upload Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm exec playwright install --with-deps
      - run: npm run e2e -- --project=chromium --grep @c103 --reporter=dot

  type-check:
    name: C103 Type Safety
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: pnpm tsc --noEmit lib/contracts/ccp09/csv-upload.ts lib/components/C103-CSVContactUpload.tsx
```

---

## Rollout Plan

### Stage 1: Staging (Internal)
1. Deploy C103 upload + CSV parser
2. Test with mock data + error cases
3. Verify audit logs created
4. Code review: confirm server-side validation

### Stage 2: Canary (1% of Pro+ CRM users)
1. Enable upload for 1% Pro+ users
2. Monitor: upload success rate, audit logs
3. Fix any CSV parsing edge cases

### Stage 3: Gradual (10% → 50% → 100%)
1. Increase to 10% over 24h
2. Monitor: conversion, support tickets
3. Ramp to 50% → 100% if no issues

### Stage 4: Enforcement Lock
1. All Pro+ CRM users can upload
2. Free/Pro users blocked by C046 paywall
3. Audit table is locked (append-only); no deletions

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| CSV parsing edge cases (quoted fields, line breaks) | High | Comprehensive test suite with edge cases |
| File size limit bypass via slow upload | Medium | Enforce limit before parsing |
| Audit table bloat | Medium | Implement log rotation; keep last 90 days |
| Invalid data slips through validation | Critical | Unit tests for each validation rule |
| RLS violation on audit table | Critical | RLS policy tests; deny-by-default |
| User uploads malicious CSV (code injection) | Low | No code execution; plain text fields only |

---

## Success Criteria

- ✅ All tests pass (unit + E2E)
- ✅ No RLS violations in staging
- ✅ Invalid rows reported with line numbers + field names
- ✅ Partial success works (valid rows imported, errors reported)
- ✅ File size + row limits enforced server-side
- ✅ Audit logs created for every upload (success/failure)
- ✅ CSV parser is deterministic (same input → same output)
- ✅ Free/Pro users see C046 paywall
- ✅ Zero invalid data in contacts table

---

## Files to Create/Modify

| File | Task | Status |
|------|------|--------|
| `lib/contracts/ccp09/csv-upload.ts` | 1.1 | Create |
| `lib/contracts/ccp09/upload-audit.ts` | 1.3 | Create |
| `lib/utils/csv-parser.ts` | 1.2 | Create |
| `lib/components/C103-CSVContactUpload.tsx` | 2.1 | Create |
| `lib/hooks/useContactAudit.ts` | 2.2 | Create |
| `app/api/workspaces/[id]/contacts/import/route.ts` | 3.1 | Create |
| `app/api/audit/contact-upload/route.ts` | 3.2 | Create |
| `supabase/migrations/20260106_add_contact_uploads.sql` | 4.1 | Create |
| `supabase/migrations/20260106_alter_contacts_for_uploads.sql` | 4.2 | Create |
| `tests/components/C103-CSVContactUpload.test.tsx` | 5.1 | Create |
| `e2e/c103-csv-contact-upload.spec.ts` | 5.2 | Create |
| `.github/workflows/ccp-09-contact-upload-checks.yml` | 6.1 | Create |

---

**Document Version:** 1.0  
**Created:** January 6, 2026  
**Maintainer:** Engineering Team (CCP-09 / CCP-07 Owner)
