// C001 AppShell — root platform container (CCP-00)
// Server-side: fetches canonical session and provides to all children via context.

import { AppShellProvider } from '@/lib/context/AppShellContext';
import type { Account } from '@/lib/contracts/account';
import type { Workspace } from '@/lib/contracts/workspace';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

    // TODO: Fetch default workspace for this user
    // const { data: workspace } = await supabase
    //   .from('workspaces')
    //   .select('*')
    //   .eq('owner_id', user.id)
    //   .order('created_at')
    //   .limit(1)
    //   .single();
    
    const workspace: Workspace | null = null;

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
