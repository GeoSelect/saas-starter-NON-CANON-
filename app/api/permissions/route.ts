import { NextRequest, NextResponse } from 'next/server';
import { getPermissions } from '@/lib/db/helpers/event-associations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resource_type') || undefined;
    
    const permissions = await getPermissions(resourceType);
    return NextResponse.json({ permissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
