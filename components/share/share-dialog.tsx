// components/share/share-dialog.tsx
'use client';

import * as React from 'react';
import { Copy, Check, Mail, ExternalLink, Clock, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ContactSelector } from '@/components/contacts/contact-selector';
import { toast } from '@/components/ui/use-toast';

interface ShareDialogProps {
  workspaceId: string;
  snapshotId: string;
  trigger?: React.ReactNode;
}

export function ShareDialog({ workspaceId, snapshotId, trigger }: ShareDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  // Form state
  const [selectedContact, setSelectedContact] = React.useState('');
  const [recipientEmail, setRecipientEmail] = React.useState('');
  const [accessRole, setAccessRole] = React.useState('viewer');
  const [expiresInDays, setExpiresInDays] = React.useState('7');
  const [requiresAuth, setRequiresAuth] = React.useState(false);
  const [sendNotification, setSendNotification] = React.useState(true);
  const [customMessage, setCustomMessage] = React.useState('');

  async function handleCreateShareLink() {
    setLoading(true);
    try {
      const res = await fetch('/api/share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          snapshot_id: snapshotId,
          recipient_contact_id: selectedContact || undefined,
          recipient_email: recipientEmail || undefined,
          access_role: accessRole,
          requires_auth: requiresAuth,
          expires_in_days: parseInt(expiresInDays),
          send_notification: sendNotification,
          custom_message: customMessage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setShareUrl(data.share_url);

      toast({
        title: 'Share link created',
        description: sendNotification 
          ? 'Notification sent to recipient' 
          : 'Copy the link to share',
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link copied!' });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Share</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Parcel Report</DialogTitle>
          <DialogDescription>
            Create a secure link to share this report with others. 
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-4 py-4">
            {/* Contact Selector */}
            <div className="space-y-2">
              <Label>Select Recipient (Optional)</Label>
              <ContactSelector
                workspaceId={workspaceId}
                value={selectedContact}
                onValueChange={(value) => {
                  setSelectedContact(value);
                  // Auto-fill email if contact selected
                  // (would need to fetch contact details)
                }}
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            {/* Access Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Access Level</Label>
              <Select value={accessRole} onValueChange={setAccessRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Viewer - Can view only
                    </div>
                  </SelectItem>
                  <SelectItem value="commenter">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Commenter - Can view and comment
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expires">Link Expires In</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger id="expires">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Require Auth */}
            <div className="flex items-center justify-between">
              <Label htmlFor="auth" className="cursor-pointer">
                Require sign-in to view
              </Label>
              <Switch
                id="auth"
                checked={requiresAuth}
                onCheckedChange={setRequiresAuth}
              />
            </div>

            {/* Send Notification */}
            <div className="flex items-center justify-between">
              <Label htmlFor="notify" className="cursor-pointer">
                Send email notification
              </Label>
              <Switch
                id="notify"
                checked={sendNotification}
                onCheckedChange={setSendNotification}
              />
            </div>

            {/* Custom Message */}
            {sendNotification && (
              <div className="space-y-2">
                <Label htmlFor="message">Custom Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expires in {expiresInDays} days</span>
            </div>

            {sendNotification && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email sent to {recipientEmail}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!shareUrl ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateShareLink} disabled={loading}>
                {loading ? 'Creating...' : 'Create Link'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpen(false)} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
