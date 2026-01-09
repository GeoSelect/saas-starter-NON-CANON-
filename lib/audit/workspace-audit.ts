/**
 * Workspace Audit Logging
 * Tracks all workspace-level changes: creation, updates, member changes, plan changes, entitlements
 * CCP-07 (Audit Logging) + CCP-05 (Entitlements)
 */

import { createServerClient } from '@supabase/ssr';

export type WorkspaceAuditAction = 
  | 'workspace.created'
  | 'workspace.updated'
  | 'workspace.deleted'
  | 'workspace.member_added'
  | 'workspace.member_removed'
  | 'workspace.member_role_changed'
  | 'workspace.plan_upgraded'
  | 'workspace.plan_downgraded'
  | 'workspace.entitlement_granted'
  | 'workspace.entitlement_denied'
  | 'workspace.entitlement_revoked'
  | 'workspace.billing_sync'
  | 'workspace.settings_updated';

export interface WorkspaceAuditEntry {
  id: string;
  workspace_id: string;
  actor_id: string;
  action: WorkspaceAuditAction;
  resource_type: 'workspace' | 'member' | 'entitlement' | 'billing';
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];
  reason?: string;
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    session_id?: string;
    [key: string]: any;
  };
  created_at: Date;
  status: 'success' | 'denied' | 'failed';
}

/**
 * Create a workspace audit entry
 */
export function createWorkspaceAuditEntry(
  workspaceId: string,
  actorId: string,
  action: WorkspaceAuditAction,
  resourceType: 'workspace' | 'member' | 'entitlement' | 'billing',
  options?: {
    resourceId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    changedFields?: string[];
    reason?: string;
    metadata?: Record<string, any>;
    status?: 'success' | 'denied' | 'failed';
  }
): WorkspaceAuditEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    workspace_id: workspaceId,
    actor_id: actorId,
    action,
    resource_type: resourceType,
    resource_id: options?.resourceId,
    old_values: options?.oldValues,
    new_values: options?.newValues,
    changed_fields: options?.changedFields,
    reason: options?.reason,
    metadata: options?.metadata,
    created_at: new Date(),
    status: options?.status || 'success',
  };
}

/**
 * Log a workspace creation
 */
export async function logWorkspaceCreated(
  supabase: ReturnType<typeof createServerClient>,
  workspaceId: string,
  actorId: string,
  workspaceName: string,
  plan: string,
  metadata?: Record<string, any>
) {
  const entry = createWorkspaceAuditEntry(
    workspaceId,
    actorId,
    'workspace.created',
    'workspace',
    {
      newValues: { name: workspaceName, plan },
      metadata,
    }
  );

  return await logAuditEntry(supabase, entry);
}

/**
 * Log a workspace update
 */
export async function logWorkspaceUpdated(
  supabase: ReturnType<typeof createServerClient>,
  workspaceId: string,
  actorId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  metadata?: Record<string, any>
) {
  const changedFields = Object.keys(newValues).filter(
    (key) => oldValues[key] !== newValues[key]
  );

  const entry = createWorkspaceAuditEntry(
    workspaceId,
    actorId,
    'workspace.updated',
    'workspace',
    {
      oldValues,
      newValues,
      changedFields,
      metadata,
    }
  );

  return await logAuditEntry(supabase, entry);
}

/**
 * Log a member being added to workspace
 */
export async function logMemberAdded(
  supabase: ReturnType<typeof createServerClient>,
  workspaceId: string,
  actorId: string,
  memberId: string,
  memberEmail: string,
  role: string,
  metadata?: Record<string, any>
) {
  const entry = createWorkspaceAuditEntry(
    workspaceId,
    actorId,
    'workspace.member_added',
    'member',
    {
      resourceId: memberId,
      newValues: { email: memberEmail, role },
      metadata,
    }
  );

  return await logAuditEntry(supabase, entry);
}

/**
 * Log a member's role being changed
 */
export async function logMemberRoleChanged(
  supabase: ReturnType<typeof createServerClient>,
  workspaceId: string,
  actorId: string,
  memberId: string,
  oldRole: string,
  newRole: string,
  metadata?: Record<string, any>
) {
  const entry = createWorkspaceAuditEntry(
    workspaceId,
    actorId,
    'workspace.member_role_changed',
    'member',
    {
      resourceId: memberId,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      metadata,
    }
  );

  return await logAuditEntry(supabase, entry);
}

/**
 * Log an entitlement check (denied or granted)
 */
export async function logEntitlementCheck(
  supabase: ReturnType<typeof createServerClient>,
  workspaceId: string,
  actorId: string,
  entitlementFeature: string,
  granted: boolean,
  reason?: string,
  metadata?: Record<string, any>
) {
  const entry = createWorkspaceAuditEntry(
    workspaceId,
    actorId,
    granted ? 'workspace.entitlement_granted' : 'workspace.entitlement_denied',
    'entitlement',
    {
      resourceId: entitlementFeature,
      reason,
      metadata,
      status: granted ? 'success' : 'denied',
    }
  );

  return await logAuditEntry(supabase, entry);
}

/**
 * Log plan upgrade/downgrade
 */
export async function logPlanChange(
  supabase: ReturnType<typeof createServerClient>,
  workspaceId: string,
  actorId: string,
  oldPlan: string,
  newPlan: string,
  reason?: string,
  metadata?: Record<string, any>
) {
  const upgradeTiers = ['free', 'pro', 'enterprise'];
  const oldIndex = upgradeTiers.indexOf(oldPlan);
  const newIndex = upgradeTiers.indexOf(newPlan);
  
  const action = newIndex > oldIndex 
    ? 'workspace.plan_upgraded' 
    : 'workspace.plan_downgraded';

  const entry = createWorkspaceAuditEntry(
    workspaceId,
    actorId,
    action,
    'billing',
    {
      oldValues: { plan: oldPlan },
      newValues: { plan: newPlan },
      reason,
      metadata,
    }
  );

  return await logAuditEntry(supabase, entry);
}

/**
 * Log billing sync from Stripe
 */
export async function logBillingSync(
  supabase: ReturnType<typeof createServerClient>,
  workspaceId: string,
  stripeCustomerId: string,
  plan: string,
  status: string,
  metadata?: Record<string, any>
) {
  const entry = createWorkspaceAuditEntry(
    workspaceId,
    'system',
    'workspace.billing_sync',
    'billing',
    {
      resourceId: stripeCustomerId,
      newValues: { plan, status },
      metadata,
    }
  );

  return await logAuditEntry(supabase, entry);
}

/**
 * Append audit entry to database (immutable append-only log)
 */
async function logAuditEntry(
  supabase: ReturnType<typeof createServerClient>,
  entry: WorkspaceAuditEntry
) {
  try {
    const { data, error } = await supabase
      .from('workspace_audit_log')
      .insert([
        {
          id: entry.id,
          workspace_id: entry.workspace_id,
          actor_id: entry.actor_id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          old_values: entry.old_values,
          new_values: entry.new_values,
          changed_fields: entry.changed_fields,
          reason: entry.reason,
          metadata: entry.metadata,
          status: entry.status,
          created_at: entry.created_at,
        },
      ]);

    if (error) {
      console.error('[audit] Failed to log entry:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[audit] Unexpected error logging entry:', err);
    return null;
  }
}

/**
 * Retrieve audit entries for a workspace
 */
export async function getWorkspaceAuditLog(
  supabase: ReturnType<typeof createServerClient>,
  workspaceId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: WorkspaceAuditAction;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  let query = supabase
    .from('workspace_audit_log')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options?.action) {
    query = query.eq('action', options.action);
  }

  if (options?.actorId) {
    query = query.eq('actor_id', options.actorId);
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[audit] Failed to retrieve log:', error);
    return [];
  }

  return data || [];
}

/**
 * Get audit summary for a workspace (statistics)
 */
export async function getWorkspaceAuditSummary(
  supabase: ReturnType<typeof createServerClient>,
  workspaceId: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('workspace_audit_log')
    .select('action, status')
    .eq('workspace_id', workspaceId)
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('[audit] Failed to get summary:', error);
    return null;
  }

  const summary = {
    total: data?.length || 0,
    byAction: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    deniedCount: 0,
  };

  data?.forEach((entry: any) => {
    summary.byAction[entry.action] = (summary.byAction[entry.action] || 0) + 1;
    summary.byStatus[entry.status] = (summary.byStatus[entry.status] || 0) + 1;
    if (entry.status === 'denied') {
      summary.deniedCount += 1;
    }
  });

  return summary;
}
