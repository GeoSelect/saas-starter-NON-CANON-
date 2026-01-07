'use client';

import * as React from 'react';
import { ShareDialog } from '@/components/share/share-dialog';
import { GovernanceWarningDialog } from '@/components/governance/governance-warning-dialog';
import { RoleSelector } from '@/components/roles/role-selector';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ShareDialogWithAssociationProps {
  workspaceId: string;
  snapshotId: string;
  trigger?: React.ReactNode;
}

export function ShareDialogWithAssociation({
  workspaceId,
  snapshotId,
  trigger,
}: ShareDialogWithAssociationProps) {
  const [showWarning, setShowWarning] = React.useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState('viewer');
  const [shareReason, setShareReason] = React.useState('');
  const [recipientEmail, setRecipientEmail] = React.useState('');

  async function handleCreateShare() {
    // Show governance warning first
    if (!warningAcknowledged) {
      setShowWarning(true);
      return;
    }

    // Proceed with share creation (including CCP-11 + CCP-12)
    const res = await fetch('/api/share-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        snapshot_id: snapshotId,
        recipient_email: recipientEmail,
        access_role: selectedRole,
        // ... other params
      }),
    });

    const { share_link } = await res.json();

    // Create event association (CCP-12)
    await fetch('/api/event-associations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        share_link_id: share_link.id,
        workspace_id: workspaceId,
        snapshot_id: snapshotId,
        role_name: selectedRole,
        association_type: 'direct_share',
        share_reason: shareReason,
        acknowledged_warning: true,
      }),
    });
  }

  return (
    <>
      {/* Main share dialog with role selector */}
      <ShareDialog
        workspaceId={workspaceId}
        snapshotId={snapshotId}
        trigger={trigger}
        onBeforeCreate={() => {
          if (!warningAcknowledged) {
            setShowWarning(true);
            return false; // Prevent creation
          }
          return true;
        }}
        additionalFields={
          <>
            <RoleSelector value={selectedRole} onValueChange={setSelectedRole} />
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Sharing (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., ARC review needed, Compliance check, etc."
                value={shareReason}
                onChange={(e) => setShareReason(e.target.value)}
                rows={2}
              />
            </div>
          </>
        }
      />

      {/* Governance warning dialog */}
      <GovernanceWarningDialog
        open={showWarning}
        onOpenChange={setShowWarning}
        warningType="record_creation"
        recipientEmail={recipientEmail}
        onAcknowledge={() => {
          setWarningAcknowledged(true);
          setShowWarning(false);
          handleCreateShare();
        }}
      />
    </>
  );
}
