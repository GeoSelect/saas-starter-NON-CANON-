import { NextRequest, NextResponse } from 'next/server';
import { getRoles } from '@/lib/db/helpers/event-associations';

export async function GET(request: NextRequest) {
  try {
    const roles = await getRoles();
    return NextResponse.json({ roles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
