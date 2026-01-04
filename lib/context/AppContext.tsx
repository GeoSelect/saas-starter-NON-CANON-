'use client';

import { createContext, useContext, ReactNode } from 'react';
import useSWR from 'swr';
import { User, TeamDataWithMembers } from '@/lib/db/schema';

type AppContextType = {
  user: User | null | undefined;
  team: TeamDataWithMembers | null | undefined;
  isLoading: boolean;
  error: any;
  isAuthenticated: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: user, error: userError, isLoading: userLoading } = useSWR<User>(
    '/api/user',
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: team, error: teamError, isLoading: teamLoading } = useSWR<TeamDataWithMembers>(
    user ? '/api/team' : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const isLoading = userLoading || teamLoading;
  const error = userError || teamError;
  const isAuthenticated = !!user && !userError;

  const value: AppContextType = {
    user,
    team,
    isLoading,
    error,
    isAuthenticated,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
