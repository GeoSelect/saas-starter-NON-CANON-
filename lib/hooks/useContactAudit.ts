// C103 CSV Contact Upload — audit hook (CCP-09, CCP-07)
'use client';

import { useCallback } from 'react';
import { useAppShell } from '@/lib/hooks/useAppShell';
import type { ContactUploadAuditEvent } from '@/lib/contracts/ccp09/upload-audit';

interface AuditUploadParams {
  fileName: string;
  fileSize: number;
  status: 'success' | 'partial' | 'failed';
  totalRows: number;
  validRows: number;
  errorRows: number;
}

/**
 * useContactAudit: Hook for logging contact upload attempts.
 * Audit failures are best-effort (no-throw), so upload succeeds even if audit fails.
 * This ensures availability over audit completeness.
 */
export function useContactAudit() {
  const appShell = useAppShell();

  const auditUpload = useCallback(
    async (params: AuditUploadParams): Promise<void> => {
      if (!appShell.workspace) {
        console.warn('[useContactAudit] No workspace available');
        return;
      }

      const event: ContactUploadAuditEvent = {
        userId: appShell.user?.id ?? 'unknown',
        workspaceId: appShell.workspace.id,
        fileName: params.fileName,
        fileSize: params.fileSize,
        status: params.status,
        totalRows: params.totalRows,
        validRows: params.validRows,
        errorRows: params.errorRows,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ipAddress: 'client', // Set by server from request
      };

      try {
        const res = await fetch('/api/audit/contact-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          credentials: 'include',
        });

        if (!res.ok) {
          // Log but don't throw; audit is best-effort
          console.warn(
            `[useContactAudit] Audit failed: ${res.status} ${res.statusText}`
          );
        }
      } catch (err) {
        // Best-effort: log to console but don't propagate
        console.warn('[useContactAudit] Audit error:', err);
      }
    },
    [appShell.workspace, appShell.user]
  );

  return { auditUpload };
}
