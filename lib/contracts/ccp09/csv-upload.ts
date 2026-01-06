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
