// C001 AppShell — React context for account/workspace/entitlements (CCP-00)
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Account } from '@/lib/contracts/account';
import type { Workspace } from '@/lib/contracts/workspace';
import type { FeatureId } from '@/lib/contracts/entitlements';
import { can } from '@/lib/contracts/entitlements';

/**
 * AppShell context shape.
 * Single source of truth for auth state and entitlements.
 */
interface AppShellContextValue {
  account: Account | null;
  workspace: Workspace | null;
  loading: boolean;
  error: Error | null;
  can: (featureId: FeatureId) => boolean;
  refresh: () => Promise<void>;
}

const AppShellContext = createContext<AppShellContextValue | undefined>(undefined);

/**
 * Provider component: wraps entire app.
 * Manages single fetch of account + workspace; provides context to all children.
 */
export function AppShellProvider({
  children,
  initialAccount,
  initialWorkspace,
}: {
  children: React.ReactNode;
  initialAccount: Account | null;
  initialWorkspace: Workspace | null;
}) {
  const [account, setAccount] = useState<Account | null>(initialAccount);
  const [workspace, setWorkspace] = useState<Workspace | null>(initialWorkspace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Refresh: fetch latest account + workspace from server.
   * Called on mount (if SSR didn't provide initial state) and on auth changes.
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Failed to refresh account: ${res.statusText}`);
      }
      const data = await res.json();
      setAccount(data.account ?? null);
      setWorkspace(data.workspace ?? null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[C001] AppShell refresh error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Feature check: deterministic boolean.
   */
  const canAccess = useCallback(
    (featureId: FeatureId): boolean => {
      return can(featureId, account, workspace);
    },
    [account, workspace],
  );

  const value: AppShellContextValue = {
    account,
    workspace,
    loading,
    error,
    can: canAccess,
    refresh,
  };

  return (
    <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
  );
}

/**
 * Hook: get AppShell context.
 * Throws if used outside AppShellProvider.
 */
export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (context === undefined) {
    throw new Error('useAppShell must be used within AppShellProvider');
  }
  return context;
}
