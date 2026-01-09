import { NextRequest, NextResponse } from 'next/server';
import { seedDemoAuditData, hasAuditData } from '@/lib/audit/seed-demo-data';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * POST /api/audit/seed-demo
 * Seeds demo audit log entries for first-time users
 * 
 * Body: { workspaceId: string }
 * 
 * Returns: { success: boolean; message: string; entriesCreated: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = supabaseBrowser();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if workspace already has audit data
    const hasData = await hasAuditData(workspaceId);
    if (hasData) {
      return NextResponse.json(
        {
          success: false,
          message: 'Workspace already has audit data. Demo data not seeded.',
          alreadyExists: true,
        },
        { status: 409 }
      );
    }

    // Seed demo data
    const result = await seedDemoAuditData(workspaceId, user.id);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[seed-demo] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed demo data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audit/seed-demo?workspaceId=...
 * Check if workspace has audit data
 * 
 * Query: { workspaceId: string }
 * 
 * Returns: { hasData: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const hasData = await hasAuditData(workspaceId);

    return NextResponse.json({
      hasData,
      workspaceId,
      message: hasData ? 'Workspace has audit data' : 'Workspace needs demo data',
    });
  } catch (error) {
    console.error('[seed-demo-check] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check audit data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
