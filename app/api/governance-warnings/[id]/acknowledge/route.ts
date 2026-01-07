import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeGovernanceWarning } from '@/lib/db/helpers/event-associations';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await acknowledgeGovernanceWarning(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
