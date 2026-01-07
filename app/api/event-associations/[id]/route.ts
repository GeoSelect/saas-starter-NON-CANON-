import { NextRequest, NextResponse } from 'next/server';
import { 
  getEventAssociation, 
  changeAssociationRole,
  revokeAssociation 
} from '@/lib/db/helpers/event-associations';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const association = await getEventAssociation(params.id);
    
    if (!association) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ association });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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
    const { new_role_name, change_reason } = body;

    if (!new_role_name) {
      return NextResponse.json(
        { error: 'new_role_name is required' },
        { status: 400 }
      );
    }

    const association = await changeAssociationRole(
      params.id,
      new_role_name,
      user.id,
      change_reason
    );

    return NextResponse.json({ association });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || undefined;

    const association = await revokeAssociation(params.id, user.id, reason);

    return NextResponse.json({ association });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
