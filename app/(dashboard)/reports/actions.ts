/**
 * CCP-01: Report Creation Actions
 *
 * Server actions for creating and managing parcel reports
 */

'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type CreateReportInput = {
  parcel_id: string;
  report_type: string;
  title?: string;
  description?: string;
  data?: Record<string, any>;
};

export type CreateReportResponse = {
  success: boolean;
  report_id?: string;
  error?: {
    code: string;
    message: string;
  };
};

/**
 * Create a new parcel report
 *
 * Requires:
 * - User authentication
 * - can_create_reports entitlement
 * - Valid workspace context
 */
export async function createReport(
  input: CreateReportInput
): Promise<CreateReportResponse> {
  try {
    const cookieStore = await cookies();

    // Create Supabase client
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
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User is not authenticated',
        },
      };
    }

    // Get user's active workspace and check entitlements
    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id, can_create_reports')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!membership?.can_create_reports) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'User does not have permission to create reports',
        },
      };
    }

    // Create report in database
    const { data: report, error: createError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        workspace_id: membership.workspace_id,
        parcel_id: input.parcel_id,
        report_type: input.report_type,
        title: input.title || `${input.report_type} Report`,
        description: input.description,
        data: input.data || {},
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (createError || !report) {
      console.error('[createReport] Database error:', createError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create report',
        },
      };
    }

    // Log activity
    await supabase.from('user_activity').insert({
      user_id: user.id,
      workspace_id: membership.workspace_id,
      activity_type: 'report_created',
      resource_id: report.id,
      resource_type: 'report',
      metadata: {
        parcel_id: input.parcel_id,
        report_type: input.report_type,
      },
    });

    return {
      success: true,
      report_id: report.id,
    };
  } catch (error) {
    console.error('[createReport] Error:', error);

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Delete a report
 *
 * Requires:
 * - User authentication
 * - Report ownership or admin role
 */
export async function deleteReport(reportId: string): Promise<CreateReportResponse> {
  try {
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
              // Handle cookie setting errors
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
      return {
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User is not authenticated',
        },
      };
    }

    // Verify ownership
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, user_id')
      .eq('id', reportId)
      .single();

    if (fetchError || !report || report.user_id !== user.id) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND_OR_UNAUTHORIZED',
          message: 'Report not found or unauthorized',
        },
      };
    }

    // Delete report
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      console.error('[deleteReport] Error:', deleteError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete report',
        },
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('[deleteReport] Error:', error);

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}
