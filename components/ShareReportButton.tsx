'use client';

import React, { useState } from 'react';
import { Share2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { ShareLinkPaywall } from './ShareLinkPaywall';

interface ShareReportButtonProps {
  /**
   * ID of the snapshot/report to share
   */
  snapshotId: string;
  
  /**
   * Workspace ID
   */
  workspaceId: string;
  
  /**
   * Optional: Custom button text
   */
  buttonText?: string;
  
  /**
   * Optional: Custom button variant
   */
  variant?: 'primary' | 'secondary' | 'outline';
  
  /**
   * Optional: Additional share link options
   */
  shareOptions?: {
    expiresAt?: Date;
    maxViews?: number;
    requiresAuth?: boolean;
    recipientEmail?: string;
    accessRole?: 'viewer' | 'commenter' | 'editor';
  };
  
  /**
   * Callback when share link is created successfully
   */
  onSuccess?: (shareLink: any) => void;
  
  /**
   * Callback when an error occurs
   */
  onError?: (error: string) => void;
}

/**
 * ShareReportButton Component
 * 
 * Button that attempts to create a share link with entitlement enforcement
 * Shows paywall modal when user doesn't have Portfolio plan
 */
export function ShareReportButton({
  snapshotId,
  workspaceId,
  buttonText = 'Share Report',
  variant = 'primary',
  shareOptions = {},
  onSuccess,
  onError,
}: ShareReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [shareLink, setShareLink] = useState<any>(null);

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/share-links/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snapshot_id: snapshotId,
          workspace_id: workspaceId,
          expires_at: shareOptions.expiresAt?.toISOString(),
          max_views: shareOptions.maxViews,
          requires_auth: shareOptions.requiresAuth,
          recipient_email: shareOptions.recipientEmail,
          access_role: shareOptions.accessRole || 'viewer',
        }),
      });

      const data = await response.json();

      if (response.status === 402) {
        // Payment required - show paywall
        setShowPaywall(true);
        if (onError) {
          onError(data.message || 'Upgrade required');
        }
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link');
      }

      // Success!
      setSuccess(true);
      setShareLink(data.share_link);
      
      if (onSuccess) {
        onSuccess(data.share_link);
      }

      // Copy to clipboard
      if (data.share_link?.url) {
        await navigator.clipboard.writeText(data.share_link.url);
      }

      // Reset success state after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = () => {
    const baseClass = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    
    if (success) {
      return `${baseClass} bg-green-600 text-white`;
    }
    
    switch (variant) {
      case 'primary':
        return `${baseClass} bg-blue-600 hover:bg-blue-700 text-white`;
      case 'secondary':
        return `${baseClass} bg-gray-600 hover:bg-gray-700 text-white`;
      case 'outline':
        return `${baseClass} bg-white hover:bg-gray-50 text-gray-700 border border-gray-300`;
      default:
        return `${baseClass} bg-blue-600 hover:bg-blue-700 text-white`;
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleShare}
          disabled={loading || success}
          className={getButtonClass()}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {success && <Check className="w-4 h-4" />}
          {!loading && !success && <Share2 className="w-4 h-4" />}
          
          {loading && 'Creating share link...'}
          {success && 'Link copied!'}
          {!loading && !success && buttonText}
        </button>

        {/* Error message */}
        {error && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 z-10">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success message with link */}
        {success && shareLink && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-green-50 border border-green-200 rounded-lg p-3 z-10">
            <p className="text-sm text-green-800 font-medium mb-2">
              Share link created and copied to clipboard!
            </p>
            <div className="bg-white rounded border border-green-300 p-2">
              <code className="text-xs text-gray-700 break-all">
                {shareLink.url}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Paywall modal */}
      {showPaywall && (
        <ShareLinkPaywall
          variant="modal"
          onUpgrade={() => {
            setShowPaywall(false);
            // Redirect is handled by Link in ShareLinkPaywall
          }}
        />
      )}
    </>
  );
}

export default ShareReportButton;
