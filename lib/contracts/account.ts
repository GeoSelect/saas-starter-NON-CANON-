// C001 AppShell — account shape contract (CCP-00)
// Canonical account type; server-authoritative via Supabase auth.

export interface Account {
  id: string; // UUID, from Supabase auth.users.id
  email: string;
  emailVerified: boolean;
  roles: AccountRole[];
  metadata?: {
    displayName?: string;
    profileUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export type AccountRole = 'admin' | 'owner' | 'member' | 'guest';

/**
 * Type guard: check if value is a valid Account.
 * Used at entrypoints to validate server-provided data.
 */
export function isAccount(value: unknown): value is Account {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as any).id === 'string' &&
    'email' in value &&
    typeof (value as any).email === 'string' &&
    'roles' in value &&
    Array.isArray((value as any).roles)
  );
}
