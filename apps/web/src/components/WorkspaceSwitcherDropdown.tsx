'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaces } from '@/hooks/useWorkspaces';

/**
 * WorkspaceSwitcherDropdown - Native select element for workspace switching
 *
 * This is the canonical workspace switcher component. It uses a native <select>
 * element for accessibility and progressive enhancement.
 *
 * Flow:
 * 1. User selects workspace from <select>
 * 2. onChange handler calls selectWorkspace (POST /api/workspaces/select)
 * 3. Server validates membership and sets httpOnly cookie
 * 4. Component calls router.refresh() to re-run server components
 * 5. Server reads the httpOnly cookie and renders fresh data
 *
 * Accessibility:
 * - Native <select> element (keyboard navigable, screen reader friendly)
 * - aria-label for context
 * - aria-live="polite" for status updates
 * - role="alert" for error messages
 */
export default function WorkspaceSwitcherDropdown() {
  const {
    workspaces,
    activeWorkspaceId,
    loading: listLoading,
    error: listError,
    selectWorkspace,
  } = useWorkspaces();

  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  if (listLoading) return <div aria-live="polite">Loading workspaces…</div>;
  if (listError) return <div role="alert">Unable to load workspaces</div>;
  if (!workspaces || workspaces.length === 0) return <div>No workspaces</div>;

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value;
    if (!newId) return;

    setLoading(true);
    try {
      // selectWorkspace performs the POST /api/workspaces/select and updates client state
      await selectWorkspace(newId);

      // Force Next.js server components to re-run
      // The server will read the httpOnly cookie and render fresh data
      router.refresh();
    } catch (err) {
      // selectWorkspace hook already logs errors to console
      console.error('Workspace switch failed', err);
      // TODO: Show toast notification here if using toast library
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label htmlFor="workspace-switcher" className="sr-only">
        Workspace
      </label>
      <select
        id="workspace-switcher"
        name="workspace"
        value={activeWorkspaceId ?? ''}
        onChange={onChange}
        aria-label="Select workspace"
        disabled={loading}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      {loading && <span aria-live="polite"> Switching…</span>}
    </div>
  );
}
