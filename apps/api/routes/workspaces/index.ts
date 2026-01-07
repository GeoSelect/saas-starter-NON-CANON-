import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/workspaces - Get all workspaces for the current user
export async function GET(request: NextRequest) {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get workspaces where user is owner or member
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('*')
      .or(`owner_id.eq.${userId},users_workspaces(workspace_id).eq.${userId}`);

    if (error) throw error;

    return NextResponse.json(workspaces || []);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { name, slug, description } = await request.json();

    // Validate input
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Create workspace
    const { data: workspace, error: createError } = await supabase
      .from('workspaces')
      .insert([
        {
          name,
          slug,
          description,
          owner_id: userId,
          plan_id: 'community', // Default to community plan
        },
      ])
      .select()
      .single();

    if (createError) throw createError;

    // Add owner to users_workspaces
    const { error: memberError } = await supabase
      .from('users_workspaces')
      .insert([
        {
          user_id: userId,
          workspace_id: workspace.id,
          role: 'owner',
        },
      ]);

    if (memberError) throw memberError;

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
