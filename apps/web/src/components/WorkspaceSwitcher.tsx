'use client';

import { useEffect, useState } from 'react';
import { Workspace } from '@/lib/types/workspace';
import { getUserWorkspaces, selectWorkspace } from '@/lib/workspace-client';
import { ChevronDown, Loader2 } from 'lucide-react';

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
  onWorkspaceChange?: (workspace_id: string) => void;
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
  onWorkspaceChange,
}: WorkspaceSwitcherProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (workspaces.length > 0 && currentWorkspaceId) {
      const workspace = workspaces.find(w => w.id === currentWorkspaceId);
      setCurrentWorkspace(workspace || null);
    }
  }, [workspaces, currentWorkspaceId]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await getUserWorkspaces();
      setWorkspaces(data || []);

      // Set first workspace as current if none selected
      if (data && data.length > 0 && !currentWorkspaceId) {
        setCurrentWorkspace(data[0]);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = async (workspace: Workspace) => {
    if (workspace.id === currentWorkspace?.id) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const result = await selectWorkspace(workspace.id);
      if (result.success) {
        setCurrentWorkspace(workspace);
        setIsOpen(false);
        onWorkspaceChange?.(workspace.id);
      } else {
        console.error('Failed to switch workspace:', result.error);
      }
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!currentWorkspace || workspaces.length === 0) {
    return (
      <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm">
        No workspaces
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
      >
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900">
            {currentWorkspace.name}
          </p>
          {currentWorkspace.description && (
            <p className="text-xs text-gray-600 truncate">
              {currentWorkspace.description}
            </p>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="max-h-60 overflow-y-auto">
            {workspaces.map(workspace => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace)}
                disabled={switching}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition border-b border-gray-100 last:border-0 disabled:opacity-50 ${
                  workspace.id === currentWorkspace.id
                    ? 'bg-orange-50 border-l-4 border-l-orange-500'
                    : ''
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-medium ${
                      workspace.id === currentWorkspace.id
                        ? 'text-orange-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {workspace.name}
                  </p>
                  {workspace.description && (
                    <p className="text-xs text-gray-600 truncate">
                      {workspace.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Plan: {workspace.plan_id}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
