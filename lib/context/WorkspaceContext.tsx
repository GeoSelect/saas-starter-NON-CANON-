"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Types
export type Workspace = {
  id: string;
  name: string;
  // Add more fields as needed
};

export type WorkspaceContextType = {
  workspace: Workspace | null;
  setWorkspace: (ws: Workspace | null) => void;
  workspaces: Workspace[];
  switchWorkspace: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceContextProvider");
  return ctx;
}

// Simulate fetching workspaces from session or API
async function fetchUserWorkspaces(): Promise<Workspace[]> {
  // Replace with real API call
  return [
    { id: "w1", name: "Demo Workspace 1" },
    { id: "w2", name: "Demo Workspace 2" },
  ];
}

export const WorkspaceContextProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  // Extract workspace_id from URL if present
  function getWorkspaceIdFromUrl(path: string): string | null {
    const match = path.match(/\/w\/([\w-]+)/);
    return match ? match[1] : null;
  }

  useEffect(() => {
    fetchUserWorkspaces().then(setWorkspaces);
  }, []);

  useEffect(() => {
    const urlId = getWorkspaceIdFromUrl(pathname);
    if (urlId) {
      const ws = workspaces.find((w) => w.id === urlId);
      if (ws) setWorkspace(ws);
    } else if (workspaces.length > 0 && !workspace) {
      // Fallback to first workspace (simulate session default)
      setWorkspace(workspaces[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, workspaces]);

  function switchWorkspace(id: string) {
    router.push(`/w/${id}`);
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, workspaces, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
