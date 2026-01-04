import { NextRequest, NextResponse } from 'next/server';
import { searchContacts, createContact } from '@/lib/contacts/contacts';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await searchContacts({
      workspaceId: params.id,
      query: searchParams.get('query') || undefined,
      contactType: searchParams.get('type') as any,
      verificationStatus: searchParams.get('verification') as any,
      membershipStatus: searchParams.get('membership') as any,
      hoaId: searchParams.get('hoa_id') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const contact = await createContact({
      ...body,
      workspace_id: params.id,
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      // Unique violation
      return NextResponse.json(
        { error: 'Contact already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
