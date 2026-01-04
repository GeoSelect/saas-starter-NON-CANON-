import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shareWithHomeowner } from '@/lib/db/helpers/share-with-homeowner';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspace_id,
      snapshot_id,
      homeowner_contact_id,
      homeowner_email,
      homeowner_name,
      access_role,
      expires_in_days,
      share_reason,
      send_notification,
      acknowledged_warning,
      custom_message,
    } = body;

    // Validation
    if (!workspace_id || !snapshot_id || !homeowner_email) {
      return NextResponse.json(
        { error: 'workspace_id, snapshot_id, and homeowner_email are required' },
        { status: 400 }
      );
    }

    // Check if warning was acknowledged
    if (!acknowledged_warning) {
      return NextResponse.json(
        { 
          error: 'Governance warning must be acknowledged',
          code: 'WARNING_NOT_ACKNOWLEDGED',
        },
        { status: 400 }
      );
    }

    // Execute share flow
    const result = await shareWithHomeowner({
      workspaceId: workspace_id,
      snapshotId: snapshot_id,
      sharerUserId: user.id,
      homeownerContactId: homeowner_contact_id,
      homeownerEmail: homeowner_email,
      homeownerName: homeowner_name,
      accessRole: access_role || 'viewer',
      expiresInDays: expires_in_days || 30,
      shareReason: share_reason,
      sendNotification: send_notification,
      acknowledgedWarning: acknowledged_warning,
      customMessage: custom_message,
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('Share with homeowner failed:', error);
    
    // Handle specific errors
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (error.code === '23503') { // Foreign key violation
      return NextResponse.json(
        { error: 'Invalid workspace, snapshot, or contact ID' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
