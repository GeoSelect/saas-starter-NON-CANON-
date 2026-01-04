import { useState, useCallback } from 'react';

export interface ShareLink {
  id: string;
  token: string;
  short_code: string;
  snapshot_id: string;
  created_at: string;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  is_revoked: boolean;
  allows_unauthenticated: boolean;
  created_by: string;
}

export interface CreateShareLinkOptions {
  expiresAt?: Date | null;
  maxViews?: number | null;
  allowsUnauthenticated?: boolean;
}

export function useShareLinks(reportId: string) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShareLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/share-links?reportId=${reportId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch share links');
      }

      const data = await res.json();
      setShareLinks(data.share_links || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  const createShareLink = useCallback(
    async (options?: CreateShareLinkOptions): Promise<ShareLink | null> => {
      try {
        setError(null);
        const res = await fetch('/api/share-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId,
            expiresAt: options?.expiresAt?.toISOString(),
            maxViews: options?.maxViews,
            allowsUnauthenticated: options?.allowsUnauthenticated ?? false,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create share link');
        }

        const data = await res.json();
        const newLink = data.share_link;

        setShareLinks([...shareLinks, newLink]);
        return newLink;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [reportId, shareLinks]
  );

  const revokeShareLink = useCallback(
    async (linkId: string): Promise<boolean> => {
      try {
        setError(null);
        const res = await fetch(`/api/share-links/${linkId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to revoke share link');
        }

        setShareLinks(shareLinks.filter((link) => link.id !== linkId));
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [shareLinks]
  );

  const getShareUrl = useCallback(
    (shortCode: string): string => {
      return `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shortCode}`;
    },
    []
  );

  return {
    shareLinks,
    loading,
    error,
    fetchShareLinks,
    createShareLink,
    revokeShareLink,
    getShareUrl,
  };
}
