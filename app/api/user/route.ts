import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getActiveWorkspace } from '@/lib/workspace/active-workspace';

export async function GET() {
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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { account: null, workspace: null },
        { status: 401 }
      );
    }

    // Build Account object
    const account = {
      id: user.id,
      email: user.email ?? '',
      emailVerified: user.email_confirmed_at !== null,
      roles: user.user_metadata?.roles ?? [],
      metadata: {
        displayName: user.user_metadata?.displayName || user.user_metadata?.full_name || user.email?.split('@')[0],
        profileUrl: user.user_metadata?.profileUrl,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };

    // Fetch active workspace for this user
    let workspace = null;

    try {
      const activeWorkspaceResult = await getActiveWorkspace(user.id);

      if (activeWorkspaceResult.ok && activeWorkspaceResult.active) {
        const workspaceId = activeWorkspaceResult.active.data.workspace_id;

        // Fetch workspace details and membership
        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select(`
            id,
            organization_name,
            organization_type,
            metadata
          `)
          .eq('id', workspaceId)
          .eq('is_active', true)
          .single();

        if (workspaceData) {
          // Fetch workspace members
          const { data: members } = await supabase
            .from('workspace_memberships')
            .select('user_id, workspace_role, created_at')
            .eq('workspace_id', workspaceId)
            .eq('is_active', true);

          workspace = {
            id: workspaceData.id,
            slug: workspaceData.metadata?.slug || workspaceData.id,
            name: workspaceData.organization_name,
            tier: 'free', // Default tier for now
            members: (members || []).map((m: any) => ({
              userId: m.user_id,
              role: m.workspace_role,
              joinedAt: m.created_at,
            })),
            metadata: {
              createdAt: workspaceData.metadata?.created_at || new Date().toISOString(),
              updatedAt: workspaceData.metadata?.updated_at || new Date().toISOString(),
            },
          };
        }
      }
    } catch (workspaceError) {
      console.error('[/api/user] Failed to fetch workspace:', workspaceError);
      // Continue without workspace
    }

    return Response.json({ account, workspace });
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json(
      { account: null, workspace: null },
      { status: 500 }
    );
  }
}
