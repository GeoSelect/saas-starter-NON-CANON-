'use client';

import * as React from 'react';
import { UserCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GovernanceWarningDialog } from '@/components/governance/governance-warning-dialog';
import { ContactSelector } from '@/components/contacts/contact-selector';
import { RoleSelector } from '@/components/roles/role-selector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';

interface ShareWithHomeownerButtonProps {
  workspaceId: string;
  snapshotId: string;
  eventId?: string;
  trigger?: React.ReactNode;
}

export function ShareWithHomeownerButton({
  workspaceId,
  snapshotId,
  eventId,
  trigger,
}: ShareWithHomeownerButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [showWarning, setShowWarning] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Form state
  const [selectedContact, setSelectedContact] = React.useState('');
  const [homeownerEmail, setHomeownerEmail] = React.useState('');
  const [accessRole, setAccessRole] = React.useState('viewer');
  const [shareReason, setShareReason] = React.useState('');
  const [sendNotification, setSendNotification] = React.useState(true);
  const [customMessage, setCustomMessage] = React.useState('');
  const [warningAcknowledged, setWarningAcknowledged] = React.useState(false);

  // Auto-populate email when contact selected
  React.useEffect(() => {
    if (selectedContact) {
      // Fetch contact details
      fetch(`/api/contacts/${selectedContact}`)
        .then(res => res.json())
        .then(data => {
          if (data.contact) {
            setHomeownerEmail(data.contact.email);
          }
        });
    }
  }, [selectedContact]);

  async function handleShare() {
    if (!warningAcknowledged) {
      setShowWarning(true);
      return;
    }

    if (!homeownerEmail) {
      toast({
        title: 'Error',
        description: 'Homeowner email is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = eventId
        ? `/api/events/${eventId}/share-with-homeowner`
        : '/api/share-with-homeowner';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          snapshot_id: snapshotId,
          homeowner_contact_id: selectedContact || undefined,
          homeowner_email: homeownerEmail,
          access_role: accessRole,
          expires_in_days: 30,
          share_reason: shareReason,
          send_notification: sendNotification,
          acknowledged_warning: warningAcknowledged,
          custom_message: customMessage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'WARNING_NOT_ACKNOWLEDGED') {
          setShowWarning(true);
          return;
        }
        throw new Error(data.error);
      }

      toast({
        title: 'Report shared successfully',
        description: sendNotification
          ? `Email sent to ${homeownerEmail}`
          : 'Share link created',
      });

      setOpen(false);
      resetForm();

    } catch (error: any) {
      toast({
        title: 'Failed to share report',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedContact('');
    setHomeownerEmail('');
    setAccessRole('viewer');
    setShareReason('');
    setSendNotification(true);
    setCustomMessage('');
    setWarningAcknowledged(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <UserCheck className="mr-2 h-4 w-4" />
              Share with Homeowner
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Share Report with Homeowner</DialogTitle>
            <DialogDescription>
              Create a secure link to share this parcel report with the property owner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Contact Selector */}
            <div className="space-y-2">
              <Label>Select Homeowner</Label>
              <ContactSelector
                workspaceId={workspaceId}
                value={selectedContact}
                onValueChange={setSelectedContact}
                placeholder="Select from contacts..."
              />
            </div>

            {/* Email (manual or auto-filled) */}
            <div className="space-y-2">
              <Label htmlFor="email">Homeowner Email *</Label>
              <input
                id="email"
                type="email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="homeowner@example.com"
                value={homeownerEmail}
                onChange={(e) => setHomeownerEmail(e.target.value)}
              />
            </div>

            {/* Role Selector */}
            <RoleSelector value={accessRole} onValueChange={setAccessRole} />

            {/* Share Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Sharing (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Property compliance review, ARC approval needed"
                value={shareReason}
                onChange={(e) => setShareReason(e.target.value)}
                rows={2}
              />
            </div>

            {/* Send Notification Toggle */}
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
                  placeholder="Add a personal message to the email..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Link Details:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Expires in 30 days</li>
                <li>• No login required for homeowner</li>
                <li>• View-only access by default</li>
                <li>• All access tracked for audit</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={loading || !homeownerEmail}>
              {loading ? 'Sharing...' : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Share Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Governance Warning Dialog */}
      <GovernanceWarningDialog
        open={showWarning}
        onOpenChange={setShowWarning}
        warningType="record_creation"
        recipientEmail={homeownerEmail}
        onAcknowledge={() => {
          setWarningAcknowledged(true);
          setShowWarning(false);
          handleShare();
        }}
      />
    </>
  );
}
