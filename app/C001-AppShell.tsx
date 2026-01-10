// C001 AppShell — root platform container (CCP-00)
// Server-side: fetches canonical session and provides to all children via context.

import { AppShellProvider } from '@/lib/context/AppShellContext';
import type { Account } from '@/lib/contracts/account';
import type { Workspace } from '@/lib/contracts/workspace';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getActiveWorkspace } from '@/lib/workspace/active-workspace';

/**
 * Fetch server-side session: account + current workspace.
 * Called at mount time; provides initial state to AppShellProvider.
 */
async function getServerSession(): Promise<{
  account: Account | null;
  workspace: Workspace | null;
}> {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase server client
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
              // Ignore set cookie errors in server components
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
      return { account: null, workspace: null };
    }

    // Build Account object
    const account: Account = {
      id: user.id,
      email: user.email ?? '',
      emailVerified: user.email_confirmed_at !== null,
      roles: user.user_metadata?.roles ?? [],
      metadata: {
        displayName: user.user_metadata?.displayName,
        profileUrl: user.user_metadata?.profileUrl,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };

    // Fetch active workspace for this user
    let workspace: Workspace | null = null;
    
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
      console.error('[C001] AppShell: failed to fetch workspace', workspaceError);
      // Continue without workspace - user can create one later
    }

    return { account, workspace };
  } catch (err) {
    console.error('[C001] AppShell: failed to fetch server session', err);
    return { account: null, workspace: null };
  }
}

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side: fetch canonical session
  const { account, workspace } = await getServerSession();

  return (
    <AppShellProvider initialAccount={account} initialWorkspace={workspace}>
      {children}
    </AppShellProvider>
  );
}
