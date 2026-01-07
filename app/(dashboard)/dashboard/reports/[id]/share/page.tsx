'use client';

import { useState } from 'react';
import { ContactSelector } from '@/components/contacts/contact-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShareReportPage({
  params,
}: {
  params: { id: string };
}) {
  const [selectedContact, setSelectedContact] = useState<string>('');
  const workspaceId = 'current-workspace-id'; // From context/CCP-05

  async function handleShare() {
    if (!selectedContact) return;

    // Create share link (CCP-11)
    const res = await fetch(`/api/reports/${params.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: selectedContact,
        workspace_id: workspaceId,
      }),
    });

    const data = await res.json();
    console.log('Share link created:', data.share_link);
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Share Parcel Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Recipient
            </label>
            <ContactSelector
              workspaceId={workspaceId}
              value={selectedContact}
              onValueChange={setSelectedContact}
            />
          </div>

          <Button
            onClick={handleShare}
            disabled={!selectedContact}
            className="w-full"
          >
            Share Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
