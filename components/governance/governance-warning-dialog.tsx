'use client';

import * as React from 'react';
import { AlertTriangle, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface GovernanceWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warningType: 'record_creation' | 'permanent_share' | 'external_recipient' | 'sensitive_data';
  recipientEmail?: string;
  onAcknowledge: () => void;
}

export function GovernanceWarningDialog({
  open,
  onOpenChange,
  warningType,
  recipientEmail,
  onAcknowledge,
}: GovernanceWarningDialogProps) {
  const [understood, setUnderstood] = React.useState(false);

  const warningConfig = {
    record_creation: {
      icon: FileText,
      title: 'You Are About to Create a Record',
      description: 'This action will create a permanent, auditable record of this share event.',
      details: [
        'This record cannot be deleted',
        'All access will be logged',
        'The snapshot will be frozen at this moment in time',
        'Audit trail will be maintained for compliance',
      ],
    },
    permanent_share: {
      icon: Shield,
      title: 'Permanent Share Warning',
      description: 'Once shared, this report cannot be un-shared completely.',
      details: [
        'Recipient may download or save the content',
        'Revoking the link stops future access only',
        'Already viewed content may be retained',
        'Consider the sensitivity of the data',
      ],
    },
    external_recipient: {
      icon: AlertTriangle,
      title: 'External Recipient Warning',
      description: `You are sharing with an external contact: ${recipientEmail}`,
      details: [
        'This recipient is not a workspace member',
        'They will have view-only access',
        'All access will be tracked',
        'Ensure you have authorization to share',
      ],
    },
    sensitive_data: {
      icon: AlertTriangle,
      title: 'Sensitive Data Warning',
      description: 'This report contains sensitive property information.',
      details: [
        'Personal homeowner information included',
        'HOA compliance data may be confidential',
        'Verify recipient authorization',
        'Ensure compliance with privacy policies',
      ],
    },
  };

  const config = warningConfig[warningType];
  const Icon = config.icon;

  function handleAcknowledge() {
    if (!understood) return;
    onAcknowledge();
    onOpenChange(false);
    setUnderstood(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Icon className="h-6 w-6 text-yellow-600" />
            </div>
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription>
            <ul className="space-y-2 text-sm">
              {config.details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="understood"
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(checked as boolean)}
          />
          <label
            htmlFor="understood"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I understand and wish to proceed
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAcknowledge} disabled={!understood}>
            Acknowledge & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
