/**
 * CCP-09: Contact Email API (Gmail Integration)
 * 
 * **Routes**:
 * - POST /api/contacts/send-email - Send email to contact via Gmail API (Pro Plus+ required)
 * - GET /api/contacts/send-email - Get email send history
 * 
 * **Tier Gating**: Pro Plus / Portfolio / Enterprise (ccp-09:contact-upload)
 * 
 * **Gmail API Integration**:
 * Requires OAuth 2.0 credentials and user consent to send emails on their behalf
 * 
 * @see lib/db/helpers/entitlements.ts - Tier checking
 * @see migrations/011_ccp09_contacts_crm.sql - Database schema
 * @see https://developers.google.com/gmail/api/guides/sending - Gmail API docs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hasWorkspaceEntitlement } from '@/app/(dashboard)/pricing/lib/db/helpers/entitlements';
import { google } from 'googleapis';

// ============================================================================
// Types
// ============================================================================

interface SendEmailRequest {
  workspace_id: string;
  contact_id: string;
  subject: string;
  body: string;
  gmail_access_token?: string; // User's Gmail OAuth token
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
// Gmail API Helper
// ============================================================================

/**
 * Send email via Gmail API
 * 
 * @param accessToken - User's Gmail OAuth access token
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param body - Email body (plain text or HTML)
 * @returns Gmail message ID and thread ID
 */
async function sendGmailEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ messageId: string; threadId: string }> {
  // Create Gmail API client
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth });

  // Construct email message (RFC 2822 format)
  const email = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ].join('\n');

  // Encode email in base64url format
  const encodedMessage = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Send email
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return {
    messageId: response.data.id!,
    threadId: response.data.threadId!,
  };
}

// ============================================================================
// POST /api/contacts/send-email - Send Email to Contact
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
    const body: SendEmailRequest = await request.json();
    const { workspace_id, contact_id, subject, body: emailBody, gmail_access_token } = body;

    // 3. Validate required fields
    if (!workspace_id || !contact_id || !subject || !emailBody) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'workspace_id, contact_id, subject, and body are required',
        },
        { status: 400 }
      );
    }

    // 4. Check entitlement (CCP-09 specific) - Pro Plus tier required
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
          message: 'Contact Email requires Pro Plus or higher plan',
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

    // 6. Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, email, name, workspace_id')
      .eq('id', contact_id)
      .eq('workspace_id', workspace_id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Not found', message: 'Contact not found' },
        { status: 404 }
      );
    }

    // 7. Create email record (pending status)
    const { data: emailRecord, error: emailError } = await supabase
      .from('contact_emails')
      .insert({
        workspace_id,
        contact_id,
        subject,
        body: emailBody,
        sent_by: user.id,
        status: 'pending',
      })
      .select('id')
      .single();

    if (emailError || !emailRecord) {
      return NextResponse.json(
        {
          error: 'Failed to create email record',
          message: emailError?.message || 'Database error',
        },
        { status: 500 }
      );
    }

    // 8. Send email via Gmail API
    try {
      // Check if Gmail access token provided
      if (!gmail_access_token) {
        // Update record as failed
        await supabase
          .from('contact_emails')
          .update({
            status: 'failed',
            error_message: 'Gmail access token required. User must authorize Gmail API access.',
          })
          .eq('id', emailRecord.id);

        return NextResponse.json(
          {
            error: 'Gmail authorization required',
            message: 'Please connect your Gmail account to send emails',
            auth_url: '/api/auth/gmail/authorize', // OAuth flow endpoint
            email_id: emailRecord.id,
          },
          { status: 403 }
        );
      }

      // Send email
      const { messageId, threadId } = await sendGmailEmail(
        gmail_access_token,
        contact.email,
        subject,
        emailBody
      );

      // Update email record as sent
      await supabase
        .from('contact_emails')
        .update({
          status: 'sent',
          gmail_message_id: messageId,
          gmail_thread_id: threadId,
          sent_at: new Date().toISOString(),
        })
        .eq('id', emailRecord.id);

      return NextResponse.json(
        {
          message: 'Email sent successfully',
          email_id: emailRecord.id,
          gmail_message_id: messageId,
          gmail_thread_id: threadId,
          sent_to: contact.email,
        },
        { status: 200 }
      );
    } catch (gmailError: any) {
      console.error('[CCP-09] Gmail API error:', gmailError);

      // Update email record as failed
      await supabase
        .from('contact_emails')
        .update({
          status: 'failed',
          error_message: gmailError.message || 'Gmail API error',
        })
        .eq('id', emailRecord.id);

      return NextResponse.json(
        {
          error: 'Email send failed',
          message: gmailError.message || 'Failed to send email via Gmail',
          email_id: emailRecord.id,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('[CCP-09] Send email error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err.message || 'Failed to send email',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/contacts/send-email - Get Email Send History
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
    const contact_id = searchParams.get('contact_id');
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

    // 4. Build query
    let query = supabase
      .from('contact_emails')
      .select('*, contacts(email, name)')
      .eq('workspace_id', workspace_id);

    if (contact_id) {
      query = query.eq('contact_id', contact_id);
    }

    const { data: emails, error: emailsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (emailsError) {
      return NextResponse.json(
        {
          error: 'Query failed',
          message: 'Failed to retrieve email history',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        emails: emails || [],
        count: emails?.length || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[CCP-09] Email history error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err.message || 'Failed to retrieve email history',
      },
      { status: 500 }
    );
  }
}
