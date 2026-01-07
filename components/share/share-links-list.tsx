// components/share/share-links-list.tsx
'use client';

import * as React from 'react';
import { Copy, Trash2, ExternalLink, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

interface ShareLink {
  id: string;
  token: string;
  short_code?: string;
  recipient_email?: string;
  access_role: string;
  expires_at: string;
  revoked_at?: string;
  view_count: number;
  created_at: string;
}

interface ShareLinksListProps {
  snapshotId: string;
}

export function ShareLinksList({ snapshotId }: ShareLinksListProps) {
  const [shareLinks, setShareLinks] = React.useState<ShareLink[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchShareLinks();
  }, [snapshotId]);

  async function fetchShareLinks() {
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}/share-links`);
      const data = await res.json();
      setShareLinks(data.share_links || []);
    } catch (error) {
      console.error('Failed to fetch share links:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(token: string) {
    try {
      const res = await fetch(`/api/share-links/${token}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to revoke link');

      toast({ title: 'Link revoked' });
      fetchShareLinks(); // Refresh list
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  function handleCopy(token: string) {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!' });
  }

  if (loading) {
    return <div className="text-center py-8">Loading share links...</div>;
  }

  if (shareLinks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No share links created yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Share Links</CardTitle>
        <CardDescription>Manage access to this report</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {shareLinks.map((link) => {
            const isExpired = new Date(link.expires_at) < new Date();
            const isRevoked = !!link.revoked_at;
            const isActive = !isExpired && !isRevoked;

            return (
              <div
                key={link.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {link.recipient_email && (
                      <span className="font-medium truncate">
                        {link.recipient_email}
                      </span>
                    )}
                    {isActive ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : isRevoked ? (
                      <Badge variant="destructive">Revoked</Badge>
                    ) : (
                      <Badge variant="outline">Expired</Badge>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {link.access_role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {link.view_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires {new Date(link.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isActive && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopy(link.token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke share link?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will immediately disable access for anyone using this link.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRevoke(link.token)}>
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
