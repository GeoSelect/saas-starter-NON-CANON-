import { NextRequest, NextResponse } from 'next/server';
import { getContactGroups } from '@/lib/contacts/contacts';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groups = await getContactGroups(params.id);
    return NextResponse.json({ groups });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
