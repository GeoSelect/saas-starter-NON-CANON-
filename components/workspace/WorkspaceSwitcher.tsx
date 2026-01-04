"use client";
import React from "react";
import { useWorkspace } from "../../lib/context/WorkspaceContext";

export function WorkspaceSwitcher() {
  const { workspaces, workspace, switchWorkspace } = useWorkspace();

  if (!workspace || workspaces.length === 0) return null;

  return (
    <div className="workspace-switcher">
      <label htmlFor="workspace-select" className="sr-only">
        Switch workspace
      </label>
      <select
        id="workspace-select"
        value={workspace.id}
        onChange={(e) => switchWorkspace(e.target.value)}
        className="border rounded px-2 py-1"
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>
    </div>
  );
}
