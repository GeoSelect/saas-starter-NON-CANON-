/**
 * CCP-09: Contact Upload API (CSV Import)
 * 
 * **Routes**:
 * - POST /api/contacts/import - Upload and import CSV contacts (Pro Plus+ required)
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
import { parse } from 'csv-parse/sync';

// ============================================================================
// Types
// ============================================================================

interface ContactRow {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string[];
}

interface ImportResult {
  total: number;
  success: number;
  errors: number;
  duplicates: number;
  upload_id: string;
}

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
// POST /api/contacts/import - Import CSV Contacts
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

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workspace_id = formData.get('workspace_id') as string;

    if (!file || !workspace_id) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'file and workspace_id are required',
        },
        { status: 400 }
      );
    }

    // 3. Check entitlement (CCP-09 specific) - Pro Plus tier required
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
          message: 'Contact Upload requires Pro Plus or higher plan',
          upgrade: {
            currentTier: entitlementCheck.tier,
            requiredTier: 'pro_plus',
            feature: 'ccp-09:contact-upload',
            upgradeUrl: `/pricing?feature=ccp-09:contact-upload&current=${entitlementCheck.tier}&required=pro_plus`,
          },
        },
        { status: 402 } // Payment Required
      );
    }

    // 4. Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id, user_id, role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // 5. Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: 'Maximum file size is 10MB',
        },
        { status: 400 }
      );
    }

    // 6. Read and parse CSV
    const fileContent = await file.text();
    let parsedRows: any[];
    
    try {
      parsedRows = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: 'Invalid CSV',
          message: 'Failed to parse CSV file',
          details: err.message,
        },
        { status: 400 }
      );
    }

    // 7. Check tier limits
    const { data: limitCheck, error: limitError } = await supabase
      .rpc('can_import_contacts', {
        p_workspace_id: workspace_id,
        p_row_count: parsedRows.length,
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

    // 8. Create upload record (audit trail)
    const { data: uploadRecord, error: uploadError } = await supabase
      .from('contact_uploads')
      .insert({
        workspace_id,
        uploaded_by: user.id,
        file_name: file.name,
        file_size_bytes: file.size,
        row_count: parsedRows.length,
        status: 'processing',
        ip_address: request.headers.get('x-forwarded-for') || null,
        user_agent: request.headers.get('user-agent') || null,
      })
      .select('id')
      .single();

    if (uploadError || !uploadRecord) {
      return NextResponse.json(
        {
          error: 'Upload failed',
          message: 'Failed to create upload record',
        },
        { status: 500 }
      );
    }

    // 9. Validate and import contacts
    const contacts: ContactRow[] = [];
    const errors: string[] = [];
    let duplicates = 0;

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const rowNum = i + 2; // +2 for header row and 0-index

      // Validate required fields
      if (!row.email || !row.name) {
        errors.push(`Row ${rowNum}: Missing required field (email or name)`);
        continue;
      }

      // Validate email format
      if (!emailRegex.test(row.email)) {
        errors.push(`Row ${rowNum}: Invalid email format: ${row.email}`);
        continue;
      }

      // Parse tags if present (comma-separated string)
      const tags = row.tags
        ? row.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
        : [];

      contacts.push({
        email: row.email.toLowerCase().trim(),
        name: row.name.trim(),
        phone: row.phone?.trim() || null,
        company: row.company?.trim() || null,
        notes: row.notes?.trim() || null,
        tags: tags.length > 0 ? tags : null,
      });
    }

    // 10. Insert contacts (skip duplicates)
    let successCount = 0;
    const validationErrors: any[] = [];

    for (const contact of contacts) {
      const { error: insertError } = await supabase.from('contacts').insert({
        workspace_id,
        created_by: user.id,
        ...contact,
      });

      if (insertError) {
        // Check if duplicate (unique constraint violation)
        if (insertError.code === '23505') {
          duplicates++;
        } else {
          validationErrors.push({
            email: contact.email,
            error: insertError.message,
          });
        }
      } else {
        successCount++;
      }
    }

    // 11. Update upload record with results
    await supabase
      .from('contact_uploads')
      .update({
        status: 'completed',
        success_count: successCount,
        error_count: errors.length + validationErrors.length,
        duplicate_count: duplicates,
        validation_errors: [...errors, ...validationErrors],
        completed_at: new Date().toISOString(),
      })
      .eq('id', uploadRecord.id);

    // 12. Return results
    const result: ImportResult = {
      total: parsedRows.length,
      success: successCount,
      errors: errors.length + validationErrors.length,
      duplicates,
      upload_id: uploadRecord.id,
    };

    return NextResponse.json(
      {
        message: 'Import completed',
        result,
        details: {
          validation_errors: errors.length > 0 ? errors : undefined,
          insert_errors: validationErrors.length > 0 ? validationErrors : undefined,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[CCP-09] Contact import error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err.message || 'Failed to import contacts',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/contacts/import - List Upload History
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

    // 3. Verify workspace membership
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

    // 4. Get upload history
    const { data: uploads, error: uploadsError } = await supabase
      .from('contact_uploads')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (uploadsError) {
      return NextResponse.json(
        {
          error: 'Query failed',
          message: 'Failed to retrieve upload history',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        uploads: uploads || [],
        count: uploads?.length || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[CCP-09] Upload history error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err.message || 'Failed to retrieve upload history',
      },
      { status: 500 }
    );
  }
}
