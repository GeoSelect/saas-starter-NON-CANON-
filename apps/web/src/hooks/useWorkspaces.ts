'use client';

import { useCallback, useState, useEffect } from 'react';
import { selectWorkspace as selectWorkspaceAPI } from '@/lib/workspace-client';
import { Workspace } from '@/lib/types/workspace';

/**
 * useWorkspaces - Orchestration layer over useAccountContext
 * 
 * This is the primary hook for all workspace-related operations.
 * It abstracts the account context and provides a clean, consistent API.
 *
 * Responsibilities:
 * - Track list of user's workspaces
 * - Track active/selected workspace
 * - Provide selectWorkspace callback that calls API and updates state
 * - Handle loading and error states
 *
 * When useAccountContext is available, this hook should delegate to it
 * instead of managing local state.
 */
export function useWorkspaces() {
  // TODO: When useAccountContext is implemented, replace this with:
  // const { workspaces, activeWorkspaceId, selectWorkspace: contextSelect } = useAccountContext();
  
  // Current: Local state management (until useAccountContext is available)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load workspaces on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with actual API call when available
        // const data = await getUserWorkspaces();
        // setWorkspaces(data);
        
        // TODO: Read active workspace from cookie
        // const active = getActiveWorkspaceFromCookie();
        // setActiveWorkspaceId(active);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load workspaces';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  /**
   * Select/switch to a different workspace
   * 
   * Flow:
   * 1. Calls POST /api/workspaces/select with workspace_id
   * 2. Server validates membership and sets httpOnly cookie
   * 3. Server logs WORKSPACE_SWITCH audit event
   * 4. Component calls router.refresh() to re-run server components
   * 5. Client updates local state for optimistic UI
   */
  const selectWorkspace = useCallback(
    async (workspaceId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      try {
        setError(null);
        
        const result = await selectWorkspaceAPI(workspaceId);
        
        if (result.success) {
          // Update local state immediately for optimistic UI
          setActiveWorkspaceId(workspaceId);
        } else {
          const errorMsg = result.error || 'Failed to switch workspace';
          setError(errorMsg);
        }
        
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to switch workspace';
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  /**
   * Get the currently active workspace object
   */
  const activeWorkspace = activeWorkspaceId
    ? workspaces.find((w) => w.id === activeWorkspaceId)
    : null;

  return {
    // Data
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    
    // Actions
    selectWorkspace,
    
    // State
    loading,
    error,
  };
}
