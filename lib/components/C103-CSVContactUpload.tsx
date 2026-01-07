// C103 CSV Contact Upload — upload UI component (CCP-09, CCP-07)
'use client';

import React, { useRef, useState } from 'react';
import { useAppShell } from '@/lib/hooks/useAppShell';
import { useContactAudit } from '@/lib/hooks/useContactAudit';
import type { CSVValidationResult } from '@/lib/contracts/ccp09/csv-upload';
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
