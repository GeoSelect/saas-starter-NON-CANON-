// C103 CSV Contact Upload Audit Route — append-only audit logging
// POST /api/audit/contact-upload
// CCP-07 (Audit Logging) hardening

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ContactUploadAuditEvent } from '@/lib/contracts/ccp09/upload-audit';

/**
 * POST /api/audit/contact-upload
 *
 * Logs contact upload attempts to append-only audit table.
 *
 * HARDENING:
 * 1. Append-only: inserts never updated/deleted
 * 2. Server extracts IP from request headers (not trusted from client)
 * 3. Auth: user must be logged in
 * 4. No-throw: failures logged but don't break upload flow
 * 5. RLS: users can only log audits for their own workspace
 *
 * FLOW:
 * 1. Auth: get current user
 * 2. Parse event from request body
 * 3. Extract client IP from X-Forwarded-For or connection
 * 4. Insert to contact_uploads_audit table
 * 5. Return success (or silent fail if audit breaks)
 */

export async function POST(req: NextRequest) {
  try {
    // === STEP 1: Auth ===
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // In middleware or edge runtime
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Still return 200 so client doesn't retry
      console.warn('[audit/contact-upload] Unauthorized user');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // === STEP 2: Parse event ===
    const event: ContactUploadAuditEvent = await req.json();

    // === STEP 3: Extract client IP (server-side, not trusted from client) ===
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // === STEP 4: Insert to audit table ===
    const { error: insertError } = await supabase
      .from('contact_uploads_audit')
      .insert({
        user_id: user.id,
        workspace_id: event.workspaceId,
        file_name: event.fileName,
        file_size: event.fileSize,
        status: event.status,
        total_rows: event.totalRows,
        valid_rows: event.validRows,
        error_rows: event.errorRows,
        user_agent: event.userAgent,
        ip_address: ipAddress,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      // Log the error but return success to client
      // (audit failures should not break user flow)
      console.error('[audit/contact-upload] Insert failed:', insertError);
      return NextResponse.json(
        { success: false, error: 'Audit failed' },
        { status: 500 }
      );
    }

    // === STEP 5: Return success ===
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[audit/contact-upload] Unhandled error:', err);
    // Best-effort: log but return 200 so client doesn't retry
    return NextResponse.json(
      { success: false, error: 'Audit error' },
      { status: 500 }
    );
  }
}
