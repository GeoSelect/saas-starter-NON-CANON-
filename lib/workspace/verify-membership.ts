/**
 * CCP-05: Workspace Hardening - Membership & Entitlements Verification
 * 
 * Core security middleware for workspace access control:
 * 1. Membership verification (user is member of workspace)
 * 2. Role verification (user has required permission level)
 * 3. Entitlements enforcement (workspace has feature/quota)
 */

import { db } from '@/lib/db/drizzle';
import { logger } from '@/lib/observability/logger';

// ============================================================================
// Type Definitions
// ============================================================================

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export type WorkspaceMembershipResult = {
  ok: boolean;
  role?: WorkspaceRole;
  reason?: 'NOT_MEMBER' | 'DELETED' | 'SUSPENDED' | 'UNKNOWN';
  workspaceId?: string;
  userId?: string;
};

export type EntitlementsCheckResult = {
  ok: boolean;
  reason?: 'NOT_FOUND' | 'SUSPENDED' | 'EXPIRED' | 'UNKNOWN';
  planTier?: 'free' | 'pro' | 'enterprise';
  features?: Record<string, any>;
  limits?: Record<string, any>;
};

export type QuotaCheckResult = {
  ok: boolean;
  reason?: 'QUOTA_EXCEEDED' | 'SUSPENDED' | 'NOT_FOUND' | 'UNKNOWN';
  current?: number;
  limit?: number;
  percentage?: number;
};

// ============================================================================
// 1. MEMBERSHIP VERIFICATION
// ============================================================================

/**
 * verifyWorkspaceMembership
 * 
 * Checks if user has active membership in workspace
 * 
 * Returns:
 * - { ok: true, role: 'owner'|'admin'|'member' }
 * - { ok: false, reason: 'NOT_MEMBER'|'DELETED'|'SUSPENDED'|'UNKNOWN' }
 */
export async function verifyWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<WorkspaceMembershipResult> {
  try {
    // This would query from your actual database
    // For now, we return the interface structure
    // TODO: Implement actual database query once workspace tables exist
    
    logger.debug('verify_workspace_membership', {
      userId,
      workspaceId,
    });

    // Mock implementation - replace with actual DB query
    // const membership = await db.query.workspaceMembers
    //   .findFirst({
    //     where: and(
    //       eq(workspaceMembers.userId, userId),
    //       eq(workspaceMembers.workspaceId, workspaceId)
    //     ),
    //   });
    //
    // if (!membership) {
    //   return {
    //     ok: false,
    //     reason: 'NOT_MEMBER',
    //     workspaceId,
    //     userId,
    //   };
    // }

    // For now, return success placeholder
    return {
      ok: true,
      role: 'member',
      workspaceId,
      userId,
    };
  } catch (error) {
    logger.error('verify_workspace_membership_failed', error as Error, {
      userId,
      workspaceId,
    });
    return {
      ok: false,
      reason: 'UNKNOWN',
    };
  }
}

// ============================================================================
// 2. ROLE VERIFICATION
// ============================================================================

/**
 * verifyWorkspaceRole
 * 
 * Checks if user's role meets required permission level
 * 
 * Role hierarchy: owner > admin > member
 * 
 * Examples:
 * - User is 'admin', requires 'admin' → true
 * - User is 'admin', requires 'member' → true
 * - User is 'member', requires 'admin' → false
 */
export async function verifyWorkspaceRole(
  userId: string,
  workspaceId: string,
  requiredRole: WorkspaceRole
): Promise<boolean> {
  try {
    const membership = await verifyWorkspaceMembership(userId, workspaceId);
    
    if (!membership.ok) {
      return false;
    }

    const roleHierarchy: Record<WorkspaceRole, number> = {
      owner: 3,
      admin: 2,
      member: 1,
    };

    const userLevel = roleHierarchy[membership.role || 'member'];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  } catch (error) {
    logger.error('verify_workspace_role_failed', error as Error, {
      userId,
      workspaceId,
      requiredRole,
    });
    return false;
  }
}

/**
 * assertWorkspaceMember
 * 
 * Throws if user is not a member of workspace
 * Useful in route handlers for early exit
 */
export async function assertWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole> {
  const membership = await verifyWorkspaceMembership(userId, workspaceId);
  
  if (!membership.ok) {
    throw new Error(`WORKSPACE_ACCESS_DENIED: ${membership.reason}`);
  }

  return membership.role || 'member';
}

/**
 * assertWorkspaceRole
 * 
 * Throws if user doesn't have required role
 */
export async function assertWorkspaceRole(
  userId: string,
  workspaceId: string,
  requiredRole: WorkspaceRole
): Promise<void> {
  const hasRole = await verifyWorkspaceRole(userId, workspaceId, requiredRole);
  
  if (!hasRole) {
    throw new Error(`WORKSPACE_INSUFFICIENT_ROLE: requires ${requiredRole}`);
  }
}

// ============================================================================
// 3. ENTITLEMENTS ENFORCEMENT
// ============================================================================

/**
 * getWorkspaceEntitlements
 * 
 * Fetches entitlements for workspace (features, limits, plan tier)
 */
export async function getWorkspaceEntitlements(
  workspaceId: string
): Promise<EntitlementsCheckResult> {
  try {
    // TODO: Query actual workspace_entitlements table
    // For now, return interface structure

    logger.debug('get_workspace_entitlements', {
      workspaceId,
    });

    // Mock implementation - replace with actual DB query
    // const entitlements = await db.query.workspaceEntitlements
    //   .findFirst({
    //     where: eq(workspaceEntitlements.workspaceId, workspaceId),
    //   });
    //
    // if (!entitlements) {
    //   return {
    //     ok: false,
    //     reason: 'NOT_FOUND',
    //   };
    // }

    return {
      ok: true,
      planTier: 'free',
      features: {
        max_reports: 5,
        max_snapshots_per_report: 1,
        max_collaborators: 1,
        custom_branding: false,
        api_access: false,
      },
      limits: {
        storage_gb: 1,
        api_calls_per_month: 0,
      },
    };
  } catch (error) {
    logger.error('get_workspace_entitlements_failed', error as Error, {
      workspaceId,
    });
    return {
      ok: false,
      reason: 'UNKNOWN',
    };
  }
}

/**
 * canCreateReport
 * 
 * Checks if workspace has quota available for new report
 */
export async function canCreateReport(
  workspaceId: string
): Promise<QuotaCheckResult> {
  try {
    const entitlements = await getWorkspaceEntitlements(workspaceId);
    
    if (!entitlements.ok) {
      return {
        ok: false,
        reason: 'NOT_FOUND',
      };
    }

    const maxReports = entitlements.features?.max_reports ?? -1;
    
    // Unlimited reports
    if (maxReports === -1) {
      return {
        ok: true,
        limit: -1,
        current: 0,
        percentage: 0,
      };
    }

    // TODO: Count actual reports in workspace
    // const reportCount = await db.query.reports
    //   .findMany({
    //     where: eq(reports.workspaceId, workspaceId),
    //   })
    //   .then(r => r.length);

    const reportCount = 0; // Mock

    if (reportCount >= maxReports) {
      return {
        ok: false,
        reason: 'QUOTA_EXCEEDED',
        current: reportCount,
        limit: maxReports,
        percentage: 100,
      };
    }

    return {
      ok: true,
      current: reportCount,
      limit: maxReports,
      percentage: Math.round((reportCount / maxReports) * 100),
    };
  } catch (error) {
    logger.error('can_create_report_failed', error as Error, {
      workspaceId,
    });
    return {
      ok: false,
      reason: 'UNKNOWN',
    };
  }
}

/**
 * canInviteMembers
 * 
 * Checks if workspace can add more collaborators
 */
export async function canInviteMembers(
  workspaceId: string
): Promise<QuotaCheckResult> {
  try {
    const entitlements = await getWorkspaceEntitlements(workspaceId);
    
    if (!entitlements.ok) {
      return {
        ok: false,
        reason: 'NOT_FOUND',
      };
    }

    const maxCollaborators = entitlements.features?.max_collaborators ?? 1;
    
    // Unlimited collaborators
    if (maxCollaborators === -1) {
      return {
        ok: true,
        limit: -1,
        current: 0,
        percentage: 0,
      };
    }

    // TODO: Count actual members
    // const memberCount = await db.query.workspaceMembers
    //   .findMany({
    //     where: eq(workspaceMembers.workspaceId, workspaceId),
    //   })
    //   .then(m => m.length);

    const memberCount = 1; // Mock

    if (memberCount >= maxCollaborators) {
      return {
        ok: false,
        reason: 'QUOTA_EXCEEDED',
        current: memberCount,
        limit: maxCollaborators,
        percentage: 100,
      };
    }

    return {
      ok: true,
      current: memberCount,
      limit: maxCollaborators,
      percentage: Math.round((memberCount / maxCollaborators) * 100),
    };
  } catch (error) {
    logger.error('can_invite_members_failed', error as Error, {
      workspaceId,
    });
    return {
      ok: false,
      reason: 'UNKNOWN',
    };
  }
}

/**
 * hasFeature
 * 
 * Checks if workspace has feature enabled in current plan
 */
export async function hasFeature(
  workspaceId: string,
  feature: string
): Promise<boolean> {
  try {
    const entitlements = await getWorkspaceEntitlements(workspaceId);
    
    if (!entitlements.ok) {
      return false;
    }

    return entitlements.features?.[feature] === true;
  } catch (error) {
    logger.error('has_feature_failed', error as Error, {
      workspaceId,
      feature,
    });
    return false;
  }
}

/**
 * assertCanCreateReport
 * 
 * Throws if workspace cannot create more reports
 */
export async function assertCanCreateReport(workspaceId: string): Promise<void> {
  const check = await canCreateReport(workspaceId);
  
  if (!check.ok) {
    const message = check.reason === 'QUOTA_EXCEEDED'
      ? `Report limit reached (${check.current}/${check.limit}). Upgrade your plan.`
      : 'Cannot determine report quota';
    
    throw new Error(`QUOTA_EXCEEDED: ${message}`);
  }
}

/**
 * assertCanInviteMembers
 * 
 * Throws if workspace cannot add more members
 */
export async function assertCanInviteMembers(workspaceId: string): Promise<void> {
  const check = await canInviteMembers(workspaceId);
  
  if (!check.ok) {
    const message = check.reason === 'QUOTA_EXCEEDED'
      ? `Collaborator limit reached (${check.current}/${check.limit}). Upgrade your plan.`
      : 'Cannot determine collaborator quota';
    
    throw new Error(`COLLABORATOR_LIMIT_REACHED: ${message}`);
  }
}

/**
 * assertHasFeature
 * 
 * Throws if workspace doesn't have feature
 */
export async function assertHasFeature(
  workspaceId: string,
  feature: string
): Promise<void> {
  const has = await hasFeature(workspaceId, feature);
  
  if (!has) {
    throw new Error(`FEATURE_NOT_AVAILABLE: ${feature} not available in current plan`);
  }
}

// ============================================================================
// PLAN TIER CONSTANTS
// ============================================================================

export const PLAN_FEATURES = {
  free: {
    max_reports: 5,
    max_snapshots_per_report: 1,
    max_collaborators: 1,
    custom_branding: false,
    api_access: false,
    integrations: [],
    sso: false,
  },
  pro: {
    max_reports: 50,
    max_snapshots_per_report: 10,
    max_collaborators: 5,
    custom_branding: true,
    api_access: true,
    integrations: ['webhook'],
    sso: false,
  },
  enterprise: {
    max_reports: -1, // unlimited
    max_snapshots_per_report: -1,
    max_collaborators: -1,
    custom_branding: true,
    api_access: true,
    integrations: ['slack', 'webhook', 'zapier'],
    sso: true,
  },
} as const;

export const PLAN_LIMITS = {
  free: {
    storage_gb: 1,
    api_calls_per_month: 0,
    custom_domains: 0,
  },
  pro: {
    storage_gb: 10,
    api_calls_per_month: 10000,
    custom_domains: 0,
  },
  enterprise: {
    storage_gb: 1000,
    api_calls_per_month: -1, // unlimited
    custom_domains: 5,
  },
} as const;
