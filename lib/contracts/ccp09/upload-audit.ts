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
