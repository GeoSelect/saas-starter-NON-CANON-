'use client';

import React, { useState } from 'react';
import { AlertCircle, FileText, X } from 'lucide-react';

interface SharePdfAcceptanceGateProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptAndShare: () => void | Promise<void>;
  reportName?: string;
  isLoading?: boolean;
}

export function SharePdfAcceptanceGate({
  isOpen,
  onClose,
  onAcceptAndShare,
  reportName = 'Report',
  isLoading = false,
}: SharePdfAcceptanceGateProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!isAccepted || isSharing) return;

    setIsSharing(true);
    try {
      await onAcceptAndShare();
      // Reset state after successful share
      setIsAccepted(false);
      setIsSharing(false);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Share PDF Report</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close dialog"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Warning Banner */}
          <div className="mb-6 flex gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Important Notice</h3>
              <p className="text-sm text-amber-800">
                This report is for informational purposes only and is not a legal survey or
                determination of ownership. Users must independently verify all information with the
                appropriate authorities.
              </p>
            </div>
          </div>

          {/* Disclaimer Content */}
          <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Report Information</h4>
              <p className="text-sm text-gray-700 mb-3">
                <strong>Report:</strong> {reportName}
              </p>
              <p className="text-sm text-gray-700">
                By sharing this report, you acknowledge that:
              </p>
            </div>

            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span>
                  This report is for informational purposes only and does not constitute a legal
                  survey or determination of ownership, boundaries, zoning, or regulatory status
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span>
                  The recipient must independently verify all information with appropriate
                  authorities including County Assessor, Planning Department, or other relevant
                  agencies
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span>
                  Parcel ownership, configuration, zoning, and regulatory attributes may change
                  over time
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span>
                  No liability is assumed for errors, omissions, or the use or interpretation of
                  the information provided
                </span>
              </li>
            </ul>
          </div>

          {/* Acceptance Checkbox */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
            <input
              type="checkbox"
              id="accept-disclaimer"
              checked={isAccepted}
              onChange={(e) => setIsAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              disabled={isSharing}
            />
            <label htmlFor="accept-disclaimer" className="cursor-pointer flex-1">
              <p className="text-sm font-medium text-gray-900">
                I understand and accept the above conditions
              </p>
              <p className="text-xs text-gray-500 mt-1">
                By checking this box, you confirm that you have read and understand the disclaimer
                and limitations of this report.
              </p>
            </label>
          </div>

          {/* Additional Legal Notice */}
          <div className="mb-6 text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-semibold text-gray-700 mb-1">Legal Disclaimer:</p>
            <p>
              GeoSelect assumes no liability for errors, omissions, or the use or interpretation of
              the information provided through this report. The recipient assumes all responsibility
              for verifying the accuracy and applicability of this information before taking any
              action based on it.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 justify-end">
          <button
            onClick={onClose}
            disabled={isSharing}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!isAccepted || isSharing}
            className={`px-4 py-2 rounded-lg font-medium text-white transition flex items-center gap-2 ${
              isAccepted && !isSharing
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {isSharing ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Sharing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Share PDF Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
