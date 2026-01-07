import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ShareLink {
  id: string;
  token: string;
  short_code: string;
  created_at: string;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  is_revoked: boolean;
  allows_unauthenticated: boolean;
}

interface ShareLinksListProps {
  reportId: string;
  onLinkCreated?: (link: ShareLink) => void;
}

export function ShareLinksList({ reportId, onLinkCreated }: ShareLinksListProps) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShareLinks();
  }, [reportId]);

  const fetchShareLinks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/share-links?reportId=${reportId}`);
      if (!res.ok) throw new Error('Failed to fetch share links');
      const data = await res.json();
      setShareLinks(data.share_links || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to revoke this share link?')) return;

    try {
      const res = await fetch(`/api/share-links/${linkId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke share link');

      setShareLinks(shareLinks.filter((link) => link.id !== linkId));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreateLink = async () => {
    try {
      const res = await fetch(`/api/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      });

      if (!res.ok) throw new Error('Failed to create share link');
      const data = await res.json();

      setShareLinks([...shareLinks, data.share_link]);
      onLinkCreated?.(data.share_link);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) return <div>Loading share links...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Share Links</h3>
        <Button onClick={handleCreateLink} size="sm">
          Create Share Link
        </Button>
      </div>

      {shareLinks.length === 0 ? (
        <Card className="p-4 text-center text-gray-500">
          No share links yet. Create one to share this report.
        </Card>
      ) : (
        <div className="space-y-2">
          {shareLinks.map((link) => (
            <Card key={link.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 items-center mb-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                      {link.short_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/share/${link.short_code}`
                        )
                      }
                    >
                      Copy Link
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      Views: {link.view_count}
                      {link.max_views && `/${link.max_views}`}
                    </div>
                    {link.expires_at && (
                      <div>
                        Expires:{' '}
                        {new Date(link.expires_at).toLocaleDateString()}
                      </div>
                    )}
                    {link.is_revoked && (
                      <div className="text-red-600 font-semibold">
                        Revoked
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRevokeLink(link.id)}
                  disabled={link.is_revoked}
                >
                  Revoke
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
