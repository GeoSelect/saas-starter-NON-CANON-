import { supabaseRoute } from '@/lib/supabase/server';

export type ContactType = 'hoa_member' | 'homeowner' | 'external' | 'vendor';
export type VerificationStatus = 'verified' | 'pending' | 'unverified';
export type MembershipStatus = 'active' | 'inactive' | 'suspended';

export interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  workspace_id: string;
  contact_type: ContactType;
  verification_status: VerificationStatus;
  verified_at?: string;
  hoa_id?: string;
  parcel_id?: string;
  membership_status?: MembershipStatus;
  avatar_url?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ContactSearchParams {
  workspaceId: string;
  query?: string;
  contactType?: ContactType;
  verificationStatus?: VerificationStatus;
  membershipStatus?: MembershipStatus;
  hoaId?: string;
  limit?: number;
  offset?: number;
}

export interface ContactGroup {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  group_type: 'hoa_board' | 'arc_committee' | 'homeowners' | 'custom';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// SEARCH & FILTER
// ========================================

export async function searchContacts(params: ContactSearchParams) {
  const supabase = await supabaseRoute();

  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('workspace_id', params.workspaceId);

  // Text search
  if (params.query) {
    query = query.or(
      `first_name.ilike.%${params.query}%,last_name.ilike.%${params.query}%,email.ilike.%${params.query}%`
    );
  }

  // Filters
  if (params.contactType) {
    query = query.eq('contact_type', params.contactType);
  }
  if (params.verificationStatus) {
    query = query.eq('verification_status', params.verificationStatus);
  }
  if (params.membershipStatus) {
    query = query.eq('membership_status', params.membershipStatus);
  }
  if (params.hoaId) {
    query = query.eq('hoa_id', params.hoaId);
  }

  // Pagination
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  query = query.range(offset, offset + limit - 1);

  // Order
  query = query.order('last_name', { ascending: true });

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    contacts: data as Contact[],
    total: count || 0,
    limit,
    offset,
  };
}

// ========================================
// SINGLE CONTACT OPERATIONS
// ========================================

export async function getContact(contactId: string) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (error) throw error;
  return data as Contact;
}

export async function createContact(
  contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('contacts')
    .insert(contact)
    .select()
    .single();

  if (error) throw error;
  return data as Contact;
}

export async function updateContact(
  contactId: string,
  updates: Partial<Contact>
) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw error;
  return data as Contact;
}

export async function deleteContact(contactId: string) {
  const supabase = await supabaseRoute();

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  if (error) throw error;
  return { success: true };
}

// ========================================
// CONTACT GROUPS
// ========================================

export async function getContactGroups(workspaceId: string) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('contact_groups')
    .select(
      `
      *,
      contact_group_members(count)
    `
    )
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as ContactGroup[];
}

export async function getGroupContacts(groupId: string) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('contact_group_members')
    .select(
      `
      contact_id,
      contacts(*)
    `
    )
    .eq('group_id', groupId);

  if (error) throw error;
  return data.map((item: any) => item.contacts) as Contact[];
}

export async function addContactToGroup(
  contactId: string,
  groupId: string,
  addedBy: string
) {
  const supabase = await supabaseRoute();

  const { error } = await supabase
    .from('contact_group_members')
    .insert({ contact_id: contactId, group_id: groupId, added_by: addedBy });

  if (error) throw error;
  return { success: true };
}

export async function removeContactFromGroup(
  contactId: string,
  groupId: string
) {
  const supabase = await supabaseRoute();

  const { error } = await supabase
    .from('contact_group_members')
    .delete()
    .eq('contact_id', contactId)
    .eq('group_id', groupId);

  if (error) throw error;
  return { success: true };
}

// ========================================
// PERMISSIONS
// ========================================

export async function canShareWithContact(
  userId: string,
  contactId: string,
  workspaceId: string
) {
  const supabase = await supabaseRoute();

  // Check explicit permission
  const { data: permission } = await supabase
    .from('contact_permissions')
    .select('can_share')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .single();

  if (permission) {
    return permission.can_share;
  }

  // Default: workspace members can share with verified contacts
  const { data: contact } = await supabase
    .from('contacts')
    .select('verification_status')
    .eq('id', contactId)
    .eq('workspace_id', workspaceId)
    .single();

  return contact?.verification_status === 'verified';
}

export async function getShareableContacts(
  userId: string,
  workspaceId: string
) {
  const supabase = await supabaseRoute();

  // Get contacts user can share with
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('verification_status', 'verified')
    .eq('membership_status', 'active')
    .order('last_name', { ascending: true });

  if (error) throw error;

  // Filter by explicit permissions if they exist
  const { data: permissions } = await supabase
    .from('contact_permissions')
    .select('contact_id, can_share')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (permissions && permissions.length > 0) {
    const deniedIds = permissions
      .filter((p: any) => !p.can_share)
      .map((p: any) => p.contact_id);
    return (data as Contact[]).filter((c) => !deniedIds.includes(c.id));
  }

  return data as Contact[];
}
