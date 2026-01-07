import {
  Workspace,
  UserWorkspace,
  CreateWorkspaceRequest,
  WorkspaceStats,
} from '@/lib/types/workspace';

/**
 * Create a new workspace
 */
export async function createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace | null> {
  try {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to create workspace:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating workspace:', error);
    return null;
  }
}

/**
 * Get all workspaces for the current user
 */
export async function getUserWorkspaces(): Promise<Workspace[]> {
  try {
    const response = await fetch('/api/workspaces');
    if (!response.ok) {
      console.error('Failed to fetch workspaces:', response.statusText);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return [];
  }
}

/**
 * Get a specific workspace by ID
 */
export async function getWorkspace(workspace_id: string): Promise<Workspace | null> {
  try {
    const response = await fetch(`/api/workspaces/${workspace_id}`);
    if (!response.ok) {
      console.error('Failed to fetch workspace:', response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return null;
  }
}

/**
 * Get workspace by slug
 */
export async function getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  try {
    const response = await fetch(`/api/workspaces/slug/${slug}`);
    if (!response.ok) {
      console.error('Failed to fetch workspace:', response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return null;
  }
}

/**
 * Update a workspace
 */
export async function updateWorkspace(
  workspace_id: string,
  updates: Partial<Workspace>
): Promise<Workspace | null> {
  try {
    const response = await fetch(`/api/workspaces/${workspace_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      console.error('Failed to update workspace:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating workspace:', error);
    return null;
  }
}

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(workspace_id: string): Promise<UserWorkspace[]> {
  try {
    const response = await fetch(`/api/workspaces/${workspace_id}/members`);
    if (!response.ok) {
      console.error('Failed to fetch members:', response.statusText);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

/**
 * Invite a user to a workspace
 */
export async function inviteUserToWorkspace(
  workspace_id: string,
  email: string,
  role: 'admin' | 'member' | 'viewer' = 'member'
): Promise<UserWorkspace | null> {
  try {
    const response = await fetch(`/api/workspaces/${workspace_id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      console.error('Failed to invite user:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error inviting user:', error);
    return null;
  }
}

/**
 * Update user role in workspace
 */
export async function updateUserRole(
  workspace_id: string,
  user_id: string,
  role: 'admin' | 'member' | 'viewer'
): Promise<UserWorkspace | null> {
  try {
    const response = await fetch(`/api/workspaces/${workspace_id}/members/${user_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      console.error('Failed to update user role:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user role:', error);
    return null;
  }
}

/**
 * Remove user from workspace
 */
export async function removeUserFromWorkspace(
  workspace_id: string,
  user_id: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/workspaces/${workspace_id}/members/${user_id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('Failed to remove user:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing user:', error);
    return false;
  }
}

/**
 * Get workspace statistics
 */
export async function getWorkspaceStats(workspace_id: string): Promise<WorkspaceStats | null> {
  try {
    const response = await fetch(`/api/workspaces/${workspace_id}/stats`);
    if (!response.ok) {
      console.error('Failed to fetch stats:', response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

/**
 * Delete a workspace (owner only)
 */
export async function deleteWorkspace(workspace_id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/workspaces/${workspace_id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('Failed to delete workspace:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return false;
  }
}

/**
 * Select/switch the active workspace
 * Sets httpOnly cookie and logs audit event
 */
export async function selectWorkspace(
  workspace_id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/workspaces/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to select workspace:', data.error);
      return {
        success: false,
        error: data.error || 'Failed to select workspace',
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error('Error selecting workspace:', error);
    return {
      success: false,
      error: 'An error occurred while selecting workspace',
    };
  }
}
