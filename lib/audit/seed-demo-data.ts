import { createClient } from '@supabase/supabase-js';
import { WorkspaceAuditAction } from './workspace-audit';

/**
 * Seed demo audit data for first-time users
 * Generates realistic workspace activity history
 */

export async function seedDemoAuditData(workspaceId: string, userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  
  // Generate timestamps for the past 7 days
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const demoEntries = [
    // Day 7: Workspace Created
    {
      workspace_id: workspaceId,
      actor_id: userId,
      action: 'workspace.created' as WorkspaceAuditAction,
      resource_type: 'workspace',
      status: 'success' as const,
      old_values: null,
      new_values: {
        id: workspaceId,
        name: 'Demo Workspace',
        slug: 'demo-workspace',
        created_at: daysAgo(7).toISOString(),
      },
      changed_fields: ['name', 'slug'],
      reason: 'Initial workspace setup',
      metadata: { source: 'web', ip: '192.168.1.1' },
      created_at: daysAgo(7).toISOString(),
    },
    
    // Day 6: Team member added
    {
      workspace_id: workspaceId,
      actor_id: userId,
      action: 'workspace.member_added' as WorkspaceAuditAction,
      resource_type: 'workspace_member',
      resource_id: 'member-1',
      status: 'success' as const,
      old_values: null,
      new_values: {
        email: 'developer@demo.com',
        role: 'editor',
        added_at: daysAgo(6).toISOString(),
      },
      changed_fields: ['email', 'role'],
      reason: 'Added team member for project collaboration',
      metadata: { invitationMethod: 'email', source: 'web' },
      created_at: daysAgo(6).toISOString(),
    },
    
    // Day 5: Entitlement check - granted
    {
      workspace_id: workspaceId,
      actor_id: userId,
      action: 'workspace.entitlement_granted' as WorkspaceAuditAction,
      resource_type: 'entitlement',
      resource_id: 'advanced-analytics',
      status: 'success' as const,
      old_values: null,
      new_values: {
        feature: 'advanced-analytics',
        granted: true,
        expires_at: daysAgo(-30).toISOString(),
      },
      changed_fields: ['granted'],
      reason: 'Feature enabled in current plan',
      metadata: { plan: 'professional', checkType: 'feature-gate' },
      created_at: daysAgo(5).toISOString(),
    },
    
    // Day 4: Plan upgrade
    {
      workspace_id: workspaceId,
      actor_id: userId,
      action: 'workspace.plan_upgraded' as WorkspaceAuditAction,
      resource_type: 'subscription',
      resource_id: 'sub-demo-123',
      status: 'success' as const,
      old_values: {
        tier: 'free',
        price: 0,
        billing_cycle: 'monthly',
      },
      new_values: {
        tier: 'professional',
        price: 9900,
        billing_cycle: 'monthly',
        current_period_end: daysAgo(-30).toISOString(),
      },
      changed_fields: ['tier', 'price'],
      reason: 'User upgraded to professional plan',
      metadata: { 
        stripeCustomerId: 'cus_demo123',
        subscriptionId: 'sub-demo-123',
        source: 'web',
      },
      created_at: daysAgo(4).toISOString(),
    },
    
    // Day 3: Member role changed
    {
      workspace_id: workspaceId,
      actor_id: userId,
      action: 'workspace.member_role_changed' as WorkspaceAuditAction,
      resource_type: 'workspace_member',
      resource_id: 'member-1',
      status: 'success' as const,
      old_values: {
        role: 'editor',
      },
      new_values: {
        role: 'admin',
      },
      changed_fields: ['role'],
      reason: 'Promoted team member to admin',
      metadata: { promotedBy: userId, source: 'web' },
      created_at: daysAgo(3).toISOString(),
    },
    
    // Day 2: Entitlement check - denied
    {
      workspace_id: workspaceId,
      actor_id: 'member-2',
      action: 'workspace.entitlement_denied' as WorkspaceAuditAction,
      resource_type: 'entitlement',
      resource_id: 'white-label',
      status: 'denied' as const,
      old_values: null,
      new_values: {
        feature: 'white-label',
        denied: true,
        reason: 'Feature requires enterprise plan',
      },
      changed_fields: ['denied'],
      reason: 'Feature not available in current plan',
      metadata: { plan: 'professional', requiredPlan: 'enterprise', checkType: 'feature-gate' },
      created_at: daysAgo(2).toISOString(),
    },
    
    // Day 1: Billing sync
    {
      workspace_id: workspaceId,
      actor_id: 'system',
      action: 'workspace.billing_sync' as WorkspaceAuditAction,
      resource_type: 'subscription',
      resource_id: 'sub-demo-123',
      status: 'success' as const,
      old_values: {
        last_sync: daysAgo(8).toISOString(),
      },
      new_values: {
        last_sync: daysAgo(1).toISOString(),
        status: 'active',
        current_period_end: daysAgo(-30).toISOString(),
      },
      changed_fields: ['last_sync'],
      reason: 'Automatic daily billing sync from Stripe',
      metadata: { 
        stripeCustomerId: 'cus_demo123',
        subscriptionId: 'sub-demo-123',
        syncType: 'automatic',
      },
      created_at: daysAgo(1).toISOString(),
    },
    
    // Today: Settings updated
    {
      workspace_id: workspaceId,
      actor_id: userId,
      action: 'workspace.settings_updated' as WorkspaceAuditAction,
      resource_type: 'workspace',
      status: 'success' as const,
      old_values: {
        notifications_enabled: true,
        timezone: 'UTC',
      },
      new_values: {
        notifications_enabled: true,
        timezone: 'America/Denver',
      },
      changed_fields: ['timezone'],
      reason: 'Updated workspace timezone preferences',
      metadata: { source: 'web', ip: '192.168.1.1' },
      created_at: now.toISOString(),
    },
  ];

  // Insert demo entries
  const { error } = await supabase
    .from('workspace_audit_log')
    .insert(demoEntries);

  if (error) {
    console.error('[seed-demo-data] Error inserting demo entries:', error);
    throw error;
  }

  return {
    success: true,
    entriesCreated: demoEntries.length,
    message: `Created ${demoEntries.length} demo audit entries for workspace ${workspaceId}`,
  };
}

/**
 * Check if workspace has demo data
 */
export async function hasAuditData(workspaceId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  
  const { count, error } = await supabase
    .from('workspace_audit_log')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[seed-demo-data] Error checking audit data:', error);
    return false;
  }

  return (count || 0) > 0;
}
