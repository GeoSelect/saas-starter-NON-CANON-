import { useWorkspaces } from './useWorkspaces';

/**
 * @deprecated Use useWorkspaces() instead
 *
 * This hook is maintained for backward compatibility only.
 * It's now a thin wrapper around useWorkspaces.
 *
 * Migration path:
 * - const { activeWorkspaceId, switchWorkspace, loading, error } = useActiveWorkspace();
 * + const { activeWorkspaceId, selectWorkspace, loading, error } = useWorkspaces();
 * - await switchWorkspace(id)
 * + await selectWorkspace(id)
 *
 * Note: selectWorkspace returns { success, message?, error? }
 */
export function useActiveWorkspace() {
  const { activeWorkspaceId, selectWorkspace, loading, error } = useWorkspaces();

  // Alias selectWorkspace to switchWorkspace for backward compatibility
  const switchWorkspace = selectWorkspace;

  return {
    activeWorkspaceId,
    switchWorkspace,
    loading,
    error,
  };
}



/**
 * @deprecated Use getActiveWorkspaceFromCookie() from workspace utilities instead
 * Utility to get active workspace ID from cookies (client-side only)
 * Uses document.cookie
 */
export function getActiveWorkspaceFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null; // Server-side, not available
  }

  const cookies = document.cookie.split(';');
  const activeWorkspaceCookie = cookies.find(c =>
    c.trim().startsWith('active_workspace=')
  );

  if (activeWorkspaceCookie) {
    return decodeURIComponent(activeWorkspaceCookie.split('=')[1]);
  }

  return null;
}

/**
 * @deprecated Use getActiveWorkspaceFromRequest() from workspace utilities instead
 * Utility to extract active workspace from request cookies (server-side)
 */
export function getActiveWorkspaceFromRequest(request: any): string | null {
  return request.cookies?.get('active_workspace')?.value || null;
}
