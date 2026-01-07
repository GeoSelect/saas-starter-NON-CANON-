import { createClient } from '@/lib/supabase/server';

export type AssociationType = 'direct_share' | 'group_share' | 'public_share' | 'internal_share';
export type RelationshipStatus = 'active' | 'expired' | 'revoked' | 'transferred';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  hierarchy_level: number;
  is_system_role: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource_type: string;
  is_system_permission: boolean;
  created_at: string;
}

export interface EventAssociation {
  id: string;
  share_link_id: string;
  workspace_id: string;
  snapshot_id: string;
  sharer_user_id: string;
  recipient_contact_id?: string;
  recipient_user_id?: string;
  assigned_role_id: string;
  role_assigned_at: string;
  role_assigned_by?: string;
  association_type: AssociationType;
  share_reason?: string;
  expiration_override?: string;
  acknowledged_warning: boolean;
  acknowledged_at?: string;
  relationship_status: RelationshipStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateEventAssociationParams {
  shareLinkId: string;
  workspaceId: string;
  snapshotId: string;
  sharerUserId: string;
  recipientContactId?: string;
  recipientUserId?: string;
  roleName: string; // 'viewer', 'commenter', 'editor'
  associationType: AssociationType;
  shareReason?: string;
  acknowledgedWarning?: boolean;
  metadata?: Record<string, any>;
}

// ========================================
// ROLES & PERMISSIONS (System Data)
// ========================================

export async function getRoles(): Promise<Role[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('hierarchy_level', { ascending: true });

  if (error) throw error;
  return data as Role[];
}

export async function getRoleByName(name: string): Promise<Role | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('name', name)
    .single();

  if (error) return null;
  return data as Role;
}

export async function getPermissions(resourceType?: string): Promise<Permission[]> {
  const supabase = await createClient();
  
  let query = supabase.from('permissions').select('*');
  
  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Permission[];
}

export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('role_permissions')
    .select(`
      granted,
      permissions (*)
    `)
    .eq('role_id', roleId)
    .eq('granted', true);

  if (error) throw error;
  return data.map(rp => rp.permissions) as Permission[];
}

// ========================================
// EVENT ASSOCIATIONS (Core)
// ========================================

export async function createEventAssociation(
  params: CreateEventAssociationParams
): Promise<EventAssociation> {
  const supabase = await createClient();
  
  // Get role by name
  const role = await getRoleByName(params.roleName);
  if (!role) throw new Error(`Role '${params.roleName}' not found`);

  // Create association
  const { data: association, error } = await supabase
    .from('event_associations')
    .insert({
      share_link_id: params.shareLinkId,
      workspace_id: params.workspaceId,
      snapshot_id: params.snapshotId,
      sharer_user_id: params.sharerUserId,
      recipient_contact_id: params.recipientContactId,
      recipient_user_id: params.recipientUserId,
      assigned_role_id: role.id,
      role_assigned_by: params.sharerUserId,
      association_type: params.associationType,
      share_reason: params.shareReason,
      acknowledged_warning: params.acknowledgedWarning || false,
      acknowledged_at: params.acknowledgedWarning ? new Date().toISOString() : null,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  // Log event (CCP-15 integration)
  await logAssociationEvent({
    associationId: association.id,
    eventType: 'association_created',
    actorUserId: params.sharerUserId,
    metadata: {
      role: params.roleName,
      association_type: params.associationType,
    },
  });

  return association as EventAssociation;
}

export async function getEventAssociation(associationId: string): Promise<EventAssociation | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('event_associations')
    .select(`
      *,
      roles (*)
    `)
    .eq('id', associationId)
    .single();

  if (error) return null;
  return data as EventAssociation;
}

export async function getShareLinkAssociations(shareLinkId: string): Promise<EventAssociation[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('event_associations')
    .select(`
      *,
      roles (*)
    `)
    .eq('share_link_id', shareLinkId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as EventAssociation[];
}

export async function getWorkspaceAssociations(
  workspaceId: string,
  status?: RelationshipStatus
): Promise<EventAssociation[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('event_associations')
    .select(`
      *,
      roles (*),
      contacts (
        email,
        first_name,
        last_name
      )
    `)
    .eq('workspace_id', workspaceId);

  if (status) {
    query = query.eq('relationship_status', status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data as EventAssociation[];
}

export async function getUserSharedWithMe(userId: string): Promise<EventAssociation[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('event_associations')
    .select(`
      *,
      roles (*),
      report_snapshots (*)
    `)
    .eq('recipient_user_id', userId)
    .eq('relationship_status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as EventAssociation[];
}

// ========================================
// ROLE CHANGES
// ========================================

export async function changeAssociationRole(
  associationId: string,
  newRoleName: string,
  changedBy: string,
  changeReason?: string
): Promise<EventAssociation> {
  const supabase = await createClient();
  
  // Get current association
  const association = await getEventAssociation(associationId);
  if (!association) throw new Error('Association not found');

  // Get new role
  const newRole = await getRoleByName(newRoleName);
  if (!newRole) throw new Error(`Role '${newRoleName}' not found`);

  // Record history
  await supabase
    .from('role_change_history')
    .insert({
      event_association_id: associationId,
      previous_role_id: association.assigned_role_id,
      new_role_id: newRole.id,
      changed_by: changedBy,
      change_reason: changeReason,
    });

  // Update association
  const { data, error } = await supabase
    .from('event_associations')
    .update({
      assigned_role_id: newRole.id,
      role_assigned_by: changedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', associationId)
    .select()
    .single();

  if (error) throw error;

  // Log event (CCP-15)
  await logAssociationEvent({
    associationId,
    eventType: 'role_changed',
    actorUserId: changedBy,
    metadata: {
      previous_role_id: association.assigned_role_id,
      new_role_id: newRole.id,
      reason: changeReason,
    },
  });

  return data as EventAssociation;
}

export async function getRoleChangeHistory(associationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('role_change_history')
    .select(`
      *,
      previous_role: roles!role_change_history_previous_role_id_fkey (*),
      new_role: roles!role_change_history_new_role_id_fkey (*)
    `)
    .eq('event_association_id', associationId)
    .order('changed_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ========================================
// PERMISSION CHECKS
// ========================================

export async function hasPermission(
  associationId: string,
  permissionName: string
): Promise<boolean> {
  const supabase = await createClient();
  
  // Get association with role
  const association = await getEventAssociation(associationId);
  if (!association || association.relationship_status !== 'active') {
    return false;
  }

  // Check for permission override first
  const { data: override } = await supabase
    .from('event_association_permissions')
    .select(`
      granted,
      expires_at,
      permissions!inner (name)
    `)
    .eq('event_association_id', associationId)
    .eq('permissions.name', permissionName)
    .single();

  if (override) {
    // Check expiration
    if (override.expires_at && new Date(override.expires_at) < new Date()) {
      return false;
    }
    return override.granted;
  }

  // Check role permissions
  const { data: rolePermission } = await supabase
    .from('role_permissions')
    .select(`
      granted,
      permissions!inner (name)
    `)
    .eq('role_id', association.assigned_role_id)
    .eq('permissions.name', permissionName)
    .single();

  return rolePermission?.granted || false;
}

export async function getAssociationPermissions(associationId: string): Promise<Permission[]> {
  const supabase = await createClient();
  
  const association = await getEventAssociation(associationId);
  if (!association) return [];

  // Get role permissions
  const rolePermissions = await getRolePermissions(association.assigned_role_id);

  // Get overrides
  const { data: overrides } = await supabase
    .from('event_association_permissions')
    .select(`
      granted,
      expires_at,
      permissions (*)
    `)
    .eq('event_association_id', associationId);

  // Merge permissions (overrides take precedence)
  const permissionMap = new Map<string, Permission>();
  
  rolePermissions.forEach(p => permissionMap.set(p.id, p));
  
  overrides?.forEach((override: any) => {
    if (override.expires_at && new Date(override.expires_at) < new Date()) {
      return; // Skip expired overrides
    }
    if (override.granted) {
      permissionMap.set(override.permissions.id, override.permissions);
    } else {
      permissionMap.delete(override.permissions.id); // Remove if denied
    }
  });

  return Array.from(permissionMap.values());
}

export async function grantPermissionOverride(
  associationId: string,
  permissionName: string,
  granted: boolean,
  grantedBy: string,
  overrideReason?: string,
  expiresAt?: string
) {
  const supabase = await createClient();
  
  const permission = await supabase
    .from('permissions')
    .select('id')
    .eq('name', permissionName)
    .single();

  if (!permission.data) throw new Error(`Permission '${permissionName}' not found`);

  const { error } = await supabase
    .from('event_association_permissions')
    .upsert({
      event_association_id: associationId,
      permission_id: permission.data.id,
      granted,
      override_reason: overrideReason,
      granted_by: grantedBy,
      expires_at: expiresAt,
    });

  if (error) throw error;

  // Log event
  await logAssociationEvent({
    associationId,
    eventType: 'permission_override',
    actorUserId: grantedBy,
    metadata: {
      permission: permissionName,
      granted,
      reason: overrideReason,
    },
  });
}

// ========================================
// STATUS MANAGEMENT
// ========================================

export async function revokeAssociation(
  associationId: string,
  revokedBy: string,
  reason?: string
): Promise<EventAssociation> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('event_associations')
    .update({
      relationship_status: 'revoked',
      updated_at: new Date().toISOString(),
      metadata: { revoked_by: revokedBy, revoke_reason: reason },
    })
    .eq('id', associationId)
    .select()
    .single();

  if (error) throw error;

  // Log event
  await logAssociationEvent({
    associationId,
    eventType: 'association_revoked',
    actorUserId: revokedBy,
    metadata: { reason },
  });

  return data as EventAssociation;
}

// ========================================
// GOVERNANCE WARNINGS
// ========================================

export async function createGovernanceWarning(
  userId: string,
  warningType: 'record_creation' | 'permanent_share' | 'external_recipient' | 'sensitive_data',
  workspaceId: string,
  context?: Record<string, any>
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('governance_warnings')
    .insert({
      user_id: userId,
      warning_type: warningType,
      workspace_id: workspaceId,
      context: context || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function acknowledgeGovernanceWarning(warningId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('governance_warnings')
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', warningId);

  if (error) throw error;
}

export async function getUserPendingWarnings(userId: string, workspaceId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('governance_warnings')
    .select('*')
    .eq('user_id', userId)
    .eq('acknowledged', false);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ========================================
// EVENT LOGGING (CCP-15 integration)
// ========================================

interface LogAssociationEventParams {
  associationId: string;
  eventType: 'association_created' | 'role_changed' | 'permission_override' | 'association_revoked';
  actorUserId: string;
  metadata?: Record<string, any>;
}

async function logAssociationEvent(params: LogAssociationEventParams) {
  const supabase = await createClient();
  
  // This could integrate with share_link_events or a dedicated association_events table
  const { error } = await supabase
    .from('share_link_events')
    .insert({
      share_link_id: (await getEventAssociation(params.associationId))?.share_link_id,
      event_type: params.eventType as any,
      actor_user_id: params.actorUserId,
      metadata: {
        association_id: params.associationId,
        ...params.metadata,
      },
    });

  if (error) console.error('Failed to log association event:', error);
}
