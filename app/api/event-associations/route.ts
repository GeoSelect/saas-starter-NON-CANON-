import { NextRequest, NextResponse } from 'next/server';
import { createEventAssociation } from '@/lib/db/helpers/event-associations';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      share_link_id,
      workspace_id,
      snapshot_id,
      recipient_contact_id,
      recipient_user_id,
      role_name,
      association_type,
      share_reason,
      acknowledged_warning,
      metadata,
    } = body;

    if (!share_link_id || !workspace_id || !snapshot_id || !role_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const association = await createEventAssociation({
      shareLinkId: share_link_id,
      workspaceId: workspace_id,
      snapshotId: snapshot_id,
      sharerUserId: user.id,
      recipientContactId: recipient_contact_id,
      recipientUserId: recipient_user_id,
      roleName: role_name,
      associationType: association_type || 'direct_share',
      shareReason: share_reason,
      acknowledgedWarning: acknowledged_warning,
      metadata,
    });

    return NextResponse.json({ association }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
