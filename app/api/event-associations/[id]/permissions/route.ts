import { NextRequest, NextResponse } from 'next/server';
import { 
  getAssociationPermissions,
  grantPermissionOverride 
} from '@/lib/db/helpers/event-associations';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissions = await getAssociationPermissions(params.id);
    return NextResponse.json({ permissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { permission_name, granted, override_reason, expires_at } = body;

    if (!permission_name || granted === undefined) {
      return NextResponse.json(
        { error: 'permission_name and granted are required' },
        { status: 400 }
      );
    }

    await grantPermissionOverride(
      params.id,
      permission_name,
      granted,
      user.id,
      override_reason,
      expires_at
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
