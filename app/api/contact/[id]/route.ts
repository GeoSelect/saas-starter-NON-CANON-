import { NextRequest, NextResponse } from 'next/server';
import { getContact, updateContact, deleteContact } from '@/lib/contacts/contacts';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await getContact(params.id);
    return NextResponse.json({ contact });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const contact = await updateContact(params.id, updates);
    return NextResponse.json({ contact });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteContact(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
