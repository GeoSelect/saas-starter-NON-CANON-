import { NextRequest, NextResponse } from 'next/server';
import { 
  createGovernanceWarning,
  acknowledgeGovernanceWarning,
  getUserPendingWarnings 
} from '@/lib/db/helpers/event-associations';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id') || undefined;

    const warnings = await getUserPendingWarnings(user.id, workspaceId);
    return NextResponse.json({ warnings });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { warning_type, workspace_id, context } = body;

    if (!warning_type || !workspace_id) {
      return NextResponse.json(
        { error: 'warning_type and workspace_id are required' },
        { status: 400 }
      );
    }

    const warning = await createGovernanceWarning(
      user.id,
      warning_type,
      workspace_id,
      context
    );

    return NextResponse.json({ warning }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
