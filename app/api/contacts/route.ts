/**
 * CCP-09: Contacts API - CRUD Operations
 * 
 * **Routes**:
 * - GET /api/contacts - List all contacts for workspace (Pro Plus+ required)
 * - POST /api/contacts - Create single contact (Pro Plus+ required)
 * - DELETE /api/contacts/[id] - Delete contact
 * 
 * **Tier Gating**: Pro Plus / Portfolio / Enterprise (ccp-09:contact-upload)
 * 
 * @see lib/db/helpers/entitlements.ts - Tier checking
 * @see migrations/011_ccp09_contacts_crm.sql - Database schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hasWorkspaceEntitlement } from '@/app/(dashboard)/pricing/lib/db/helpers/entitlements';

// ============================================================================
// Supabase Client
// ============================================================================

function getSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// ============================================================================
// GET /api/contacts - List Contacts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get('workspace_id');
    const search = searchParams.get('search'); // Search by name or email
    const tags = searchParams.get('tags'); // Filter by tags (comma-separated)
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!workspace_id) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'workspace_id query parameter is required',
        },
        { status: 400 }
      );
    }

    // 3. Check entitlement
    const entitlementCheck = await hasWorkspaceEntitlement(
      workspace_id,
      'ccp-09:contact-upload',
      user.id
    );

    if (!entitlementCheck.enabled) {
      return NextResponse.json(
        {
          error: 'Feature not available',
          reason: entitlementCheck.reason,
          message: 'Contacts feature requires Pro Plus or higher plan',
        },
        { status: 402 }
      );
    }

    // 4. Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // 5. Build query
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspace_id);

    // Add search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Add tags filter (PostgreSQL array contains operator)
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query = query.contains('tags', tagArray);
    }

    const { data: contacts, error: contactsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (contactsError) {
      return NextResponse.json(
        {
          error: 'Query failed',
          message: 'Failed to retrieve contacts',
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id);

    return NextResponse.json(
      {
        contacts: contacts || [],
        count: contacts?.length || 0,
        total: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[CCP-09] List contacts error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err.message || 'Failed to list contacts',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/contacts - Create Single Contact
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { workspace_id, email, name, phone, company, notes, tags } = body;

    // 3. Validate required fields
    if (!workspace_id || !email || !name) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'workspace_id, email, and name are required',
        },
        { status: 400 }
      );
    }

    // 4. Check entitlement
    const entitlementCheck = await hasWorkspaceEntitlement(
      workspace_id,
      'ccp-09:contact-upload',
      user.id,
      {
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      }
    );

    if (!entitlementCheck.enabled) {
      return NextResponse.json(
        {
          error: 'Feature not available',
          reason: entitlementCheck.reason,
          message: 'Contacts feature requires Pro Plus or higher plan',
          upgrade: {
            currentTier: entitlementCheck.tier,
            requiredTier: 'pro_plus',
            feature: 'ccp-09:contact-upload',
            upgradeUrl: `/pricing?feature=ccp-09:contact-upload&current=${entitlementCheck.tier}&required=pro_plus`,
          },
        },
        { status: 402 }
      );
    }

    // 5. Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // 6. Check tier limits
    const { data: limitCheck, error: limitError } = await supabase
      .rpc('can_import_contacts', {
        p_workspace_id: workspace_id,
        p_row_count: 1,
      })
      .single();

    if (limitError || !limitCheck?.allowed) {
      return NextResponse.json(
        {
          error: 'Limit exceeded',
          message: limitCheck?.reason || 'Contact limit exceeded for your tier',
          current_count: limitCheck?.current_count || 0,
          tier_limit: limitCheck?.tier_limit || 0,
        },
        { status: 400 }
      );
    }

    // 7. Create contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        workspace_id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        notes: notes?.trim() || null,
        tags: tags || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (contactError) {
      // Check for duplicate email
      if (contactError.code === '23505') {
        return NextResponse.json(
          {
            error: 'Duplicate contact',
            message: 'A contact with this email already exists in this workspace',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to create contact',
          message: contactError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Contact created successfully',
        contact,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[CCP-09] Create contact error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err.message || 'Failed to create contact',
      },
      { status: 500 }
    );
  }
}
