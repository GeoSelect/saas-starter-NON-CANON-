// C001 WorkspaceContainer — workspace resolution and management (CCP-00)
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppShell } from '@/lib/context/AppShellContext';
import type { Workspace, AnonymousWorkspace } from '@/lib/contracts/workspace';

interface WorkspaceContainerProps {
  children: React.ReactNode;
  initialWorkspace?: Workspace | AnonymousWorkspace | null;
}

/**
 * WorkspaceContainer: Wraps application content and ensures valid workspace context.
 * 
 * Responsibilities:
 * - Fetches and resolves user's active workspace
 * - Handles workspace loading states
 * - Provides workspace switching capabilities
 * - Handles AnonymousWorkspace for unauthenticated users
 */
export function WorkspaceContainer({ 
  children, 
  initialWorkspace 
}: WorkspaceContainerProps) {
  const { account, workspace, loading: appShellLoading, refresh } = useAppShell();
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Resolve workspace: Ensures user has an active workspace
   * For authenticated users without a workspace, attempts to fetch or create one
   */
  const resolveWorkspace = useCallback(async (): Promise<void> => {
    if (!account || workspace) {
      // Already have workspace or no account
      return;
    }

    setIsResolving(true);
    setError(null);

    try {
      // Fetch active workspace from API
      const res = await fetch('/api/workspace/active', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        // Workspace found, refresh app shell to load it
        await refresh();
      } else if (res.status === 403) {
        // No active workspace set - this is expected for new users
        // The workspace should have been created during signup
        console.warn('[WorkspaceContainer] No active workspace found for user');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to resolve workspace');
      setError(error);
      console.error('[WorkspaceContainer] Workspace resolution error:', error);
    } finally {
      setIsResolving(false);
    }
  }, [account, workspace, refresh]);

  /**
   * Switch workspace: Changes user's active workspace
   */
  const switchWorkspace = useCallback(async (workspaceId: string): Promise<void> => {
    if (!account) {
      throw new Error('Must be authenticated to switch workspace');
    }

    setIsResolving(true);
    setError(null);

    try {
      const res = await fetch('/api/workspace/active', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to switch workspace');
      }

      // Refresh app shell to load new workspace
      await refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to switch workspace');
      setError(error);
      console.error('[WorkspaceContainer] Workspace switch error:', error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [account, refresh]);

  /**
   * Refresh workspace: Reloads current workspace data
   */
  const refreshWorkspace = useCallback(async (): Promise<void> => {
    setIsResolving(true);
    setError(null);

    try {
      await refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh workspace');
      setError(error);
      console.error('[WorkspaceContainer] Workspace refresh error:', error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [refresh]);

  // Attempt to resolve workspace on mount if authenticated but no workspace
  useEffect(() => {
    if (account && !workspace && !appShellLoading && !isResolving) {
      resolveWorkspace();
    }
  }, [account, workspace, appShellLoading, isResolving, resolveWorkspace]);

  // Provide workspace context methods to children via React Context if needed
  // For now, these methods are available via useAppShell().refresh() and custom API calls
  
  const loading = appShellLoading || isResolving;

  // Show loading state
  if (loading && !workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Show error state if critical error occurred
  if (error && !workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Workspace Error
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refreshWorkspace()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render children with workspace context
  return <>{children}</>;
}

/**
 * Hook to access workspace container methods
 * Note: For now, use useAppShell() directly for workspace access
 */
export function useWorkspaceContainer() {
  const { workspace, loading, refresh } = useAppShell();

  return {
    workspace,
    loading,
    refreshWorkspace: refresh,
  };
}
