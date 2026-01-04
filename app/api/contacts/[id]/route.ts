import { NextRequest, NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/supabase/server";
import {
  getContact,
  updateContact,
  deleteContact,
} from "@/lib/contacts/contacts";

/**
 * GET /api/contacts/[id]
 * Fetch a single contact by ID
 *
 * Responses:
 * 200: Contact details
 * 401: Unauthenticated
 * 403: Not a workspace member
 * 404: Contact not found
 * 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const contactId = params.id;
    if (!contactId) {
      return NextResponse.json(
        { ok: false, error: "Contact ID required" },
        { status: 400 }
      );
    }

    const client = await supabaseRoute();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const contact = await getContact(contactId);
    if (!contact) {
      return NextResponse.json(
        { ok: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      contact,
    });
  } catch (error) {
    console.error("GET /api/contacts/[id]:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 * Update a contact
 *
 * Request body: Partial contact update
 * {
 *   first_name?: string
 *   last_name?: string
 *   phone?: string
 *   notes?: string
 *   verification_status?: 'verified' | 'pending' | 'unverified'
 *   membership_status?: 'active' | 'inactive' | 'suspended'
 * }
 *
 * Responses:
 * 200: Updated contact
 * 400: Invalid input
 * 401: Unauthenticated
 * 403: Not a workspace owner/editor
 * 404: Contact not found
 * 500: Server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const contactId = params.id;
    if (!contactId) {
      return NextResponse.json(
        { ok: false, error: "Contact ID required" },
        { status: 400 }
      );
    }

    const client = await supabaseRoute();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const contact = await updateContact(contactId, {
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone,
      metadata: body.metadata,
      verification_status: body.verification_status,
      membership_status: body.membership_status,
    });

    if (!contact) {
      return NextResponse.json(
        { ok: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      contact,
    });
  } catch (error: any) {
    console.error("PATCH /api/contacts/[id]:", error);

    if (error.message?.includes("role")) {
      return NextResponse.json(
        { ok: false, error: "Insufficient permissions to update contact" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 * Delete a contact
 *
 * Responses:
 * 200: Contact deleted
 * 401: Unauthenticated
 * 403: Not a workspace owner/editor
 * 404: Contact not found
 * 500: Server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const contactId = params.id;
    if (!contactId) {
      return NextResponse.json(
        { ok: false, error: "Contact ID required" },
        { status: 400 }
      );
    }

    const client = await supabaseRoute();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await deleteContact(contactId);
    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Contact deleted",
    });
  } catch (error: any) {
    console.error("DELETE /api/contacts/[id]:", error);

    if (error.message?.includes("role")) {
      return NextResponse.json(
        { ok: false, error: "Insufficient permissions to delete contact" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
