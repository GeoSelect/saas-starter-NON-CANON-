// C001 AppShell — workspace shape contract (CCP-00)
// Canonical workspace type; server-authoritative via Supabase.

export interface Workspace {
  id: string; // UUID
  slug: string; // human-readable, unique per account
  name: string;
  tier: SubscriptionTier;
  members: WorkspaceMember[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    defaultParcelView?: 'map' | 'list';
  };
}

/**
 * Anonymous workspace: user browsing without account.
 * Tier is always 'free'; no members.
 */
export interface AnonymousWorkspace {
  id: null;
  slug: 'anonymous';
  tier: 'free';
  members: [];
  isAnonymous: true;
}

export type SubscriptionTier =
  | 'free'
  | 'pro'
  | 'pro-plus'
  | 'portfolio'
  | 'enterprise';

export interface WorkspaceMember {
  userId: string;
  role: 'admin' | 'owner' | 'member' | 'viewer';
  joinedAt: string;
}

/**
 * Type guard: check if value is a valid Workspace.
 */
export function isWorkspace(value: unknown): value is Workspace {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as any).id === 'string' &&
    'slug' in value &&
    'tier' in value &&
    'members' in value &&
    Array.isArray((value as any).members)
  );
}

/**
 * Type guard: check if value is an anonymous workspace.
 */
export function isAnonymousWorkspace(value: unknown): value is AnonymousWorkspace {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as any).slug === 'anonymous' &&
    (value as any).isAnonymous === true &&
    (value as any).id === null
  );
}
