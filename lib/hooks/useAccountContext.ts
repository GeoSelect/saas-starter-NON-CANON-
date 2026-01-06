/**
 * CCP-00: Account Context Hook
 *
 * useAccountContext - React hook for accessing user profile, workspace, and entitlements
 * Handles caching and provides loading/error states
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { UserProfile, AccountContextResponse } from "@/lib/types/user";

type AccountContextState = {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
};

// Simple in-memory cache with TTL
const cache = {
  data: null as UserProfile | null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes

  isValid() {
    return this.data && Date.now() - this.timestamp < this.ttl;
  },

  set(data: UserProfile) {
    this.data = data;
    this.timestamp = Date.now();
  },

  get() {
    return this.isValid() ? this.data : null;
  },

  clear() {
    this.data = null;
    this.timestamp = 0;
  },
};

// Global listeners for cache updates
const listeners = new Set<(profile: UserProfile | null) => void>();

function notifyListeners(profile: UserProfile | null) {
  listeners.forEach((listener) => listener(profile));
}

export function useAccountContext() {
  const [state, setState] = useState<AccountContextState>({
    profile: null,
    loading: true,
    error: null,
  });

  const listenerRef = useRef<(profile: UserProfile | null) => void>();

  const fetchContext = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Check cache first
      const cached = cache.get();
      if (cached) {
        setState({
          profile: cached,
          loading: false,
          error: null,
        });
        return;
      }

      const response = await fetch("/api/account/context", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as AccountContextResponse;
        throw new Error(errorData.error?.message || "Failed to fetch account context");
      }

      const data = (await response.json()) as AccountContextResponse;

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || "Invalid response");
      }

      cache.set(data.data);
      notifyListeners(data.data);

      setState({
        profile: data.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      setState({
        profile: null,
        loading: false,
        error: err,
      });
    }
  }, []);

  useEffect(() => {
    // Set up listener for cache updates
    listenerRef.current = (profile) => {
      setState({
        profile,
        loading: false,
        error: null,
      });
    };

    listeners.add(listenerRef.current);

    // Fetch on mount
    fetchContext();

    return () => {
      if (listenerRef.current) {
        listeners.delete(listenerRef.current);
      }
    };
  }, [fetchContext]);

  return {
    ...state,
    refetch: fetchContext,
  };
}

/**
 * Hook to check if user has a specific entitlement
 */
export function useEntitlement(entitlement: keyof UserProfile["entitlements"]) {
  const { profile, loading } = useAccountContext();

  return {
    has: !loading && profile ? profile.entitlements[entitlement] : false,
    loading,
  };
}

/**
 * Hook to get active workspace context
 */
export function useWorkspaceContext() {
  const { profile, loading } = useAccountContext();

  return {
    workspaceId: profile?.active_workspace_id || null,
    workspaceRole: profile?.workspace_role || null,
    organization: profile?.organization_name || null,
    loading,
  };
}

/**
 * Cache management functions (for advanced use cases)
 */
export const accountContextCache = {
  clear: () => cache.clear(),
  invalidate: () => {
    cache.clear();
    notifyListeners(null);
  },
};
