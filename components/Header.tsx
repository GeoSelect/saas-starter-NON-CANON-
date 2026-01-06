'use client';

import { useContext } from 'react';
import { AuthContext, PLAN_NAMES } from '@/lib/context/AuthContext';
import { PublicNavigation } from '@/components/PublicNavigation';

export function Header() {
  const authContext = useContext(AuthContext);

  // Handle case where Header is used outside AuthProvider
  const currentPlan = authContext?.currentPlan ?? null;
  const isLoggedIn = authContext?.isLoggedIn ?? false;
  const logout = authContext?.logout ?? (() => {});

  const currentUser = isLoggedIn && currentPlan
    ? {
        name: 'User',
        plan: PLAN_NAMES[currentPlan],
      }
    : undefined;

  return (
    <PublicNavigation
      isDashboard={true}
      isAuthenticated={isLoggedIn}
      currentUser={currentUser}
      onLogout={logout}
    />
  );
}
