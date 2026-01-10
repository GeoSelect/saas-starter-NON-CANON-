import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { setActiveWorkspace } from '@/lib/workspace/active-workspace';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        }
      }
    }
  );

  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData?.user) {
    console.error('[Auth Callback] Session exchange error:', sessionError);
    return NextResponse.redirect(`${origin}/`);
  }

  const user = sessionData.user;

  // Check if user already has a workspace
  const { data: existingMemberships } = await supabase
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1);

  // Create default workspace for new users
  if (!existingMemberships || existingMemberships.length === 0) {
    try {
      // Get user's display name from metadata or email
      const displayName = user.user_metadata?.display_name || 
                         user.user_metadata?.full_name ||
                         user.email?.split('@')[0] || 
                         'User';
      
      const workspaceName = `${displayName}'s Workspace`;
      const workspaceSlug = `${workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          organization_name: workspaceName,
          organization_type: 'hoa',
          primary_contact_email: user.email,
          is_active: true,
          metadata: {
            slug: workspaceSlug,
            created_via: 'signup',
          },
        })
        .select()
        .single();

      if (workspaceError || !workspace) {
        console.error('[Auth Callback] Failed to create default workspace:', workspaceError);
      } else {
        // Add user as owner with full permissions
        const { error: membershipError } = await supabase
          .from('workspace_memberships')
          .insert({
            user_id: user.id,
            workspace_id: workspace.id,
            workspace_role: 'owner',
            can_resolve_parcels: true,
            can_create_reports: true,
            can_share_reports: true,
            can_view_audit_log: true,
            can_manage_contacts: true,
            is_active: true,
          });

        if (membershipError) {
          console.error('[Auth Callback] Failed to create workspace membership:', membershipError);
        } else {
          // Set as active workspace
          try {
            await setActiveWorkspace(workspace.id, user.id);
            console.log('[Auth Callback] Default workspace created and set as active:', workspace.id);
          } catch (activeError) {
            console.error('[Auth Callback] Failed to set active workspace:', activeError);
          }
        }
      }
    } catch (error) {
      console.error('[Auth Callback] Error creating default workspace:', error);
      // Allow user to continue even if workspace creation fails
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
