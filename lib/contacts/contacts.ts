import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * CCP-09: Contacts Helper Functions
 * Manages HOA members, homeowners, external contacts, and vendors
 */

export type ContactType = "hoa_member" | "homeowner" | "external" | "vendor";
export type VerificationStatus = "verified" | "pending" | "unverified";
export type MembershipStatus = "active" | "inactive" | "suspended";
export type GroupType = "hoa_board" | "arc_committee" | "homeowners" | "custom";

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
  verified_by?: string;
  hoa_id?: string;
  parcel_id?: string;
  membership_status?: MembershipStatus;
  avatar_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ContactGroup {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  group_type: GroupType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContactPermission {
  id: string;
  workspace_id: string;
  user_id: string;
  contact_id: string;
  can_share: boolean;
  can_view_details: boolean;
  can_edit: boolean;
  granted_by: string;
  granted_at: string;
}

// ============================================================================
// CONTACTS CRUD
// ============================================================================

/**
 * Create a new contact
 */
export async function createContact(
  workspaceId: string,
  data: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    contact_type: ContactType;
    verification_status?: VerificationStatus;
    hoa_id?: string;
    parcel_id?: string;
    membership_status?: MembershipStatus;
    avatar_url?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ ok: true; contact: Contact } | { ok: false; error: string }> {
  try {
    // Validate contact_type and membership_status relationship
    if (
      data.contact_type === "hoa_member" &&
      !data.membership_status
    ) {
      return {
        ok: false,
        error: "hoa_member contacts must have membership_status",
      };
    }

    if (
      data.contact_type !== "hoa_member" &&
      data.membership_status
    ) {
      return {
        ok: false,
        error: `${data.contact_type} contacts cannot have membership_status`,
      };
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        workspace_id: workspaceId,
        ...data,
        verification_status: data.verification_status || "unverified",
      })
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, contact };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Get contact by ID
 */
export async function getContact(
  contactId: string
): Promise<{ ok: true; contact: Contact } | { ok: false; error: string }> {
  try {
    const { data: contact, error } = await supabase
      .from("contacts")
      .select()
      .eq("id", contactId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { ok: false, error: "contact_not_found" };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true, contact };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * List contacts in workspace with filtering
 */
export async function listContacts(
  workspaceId: string,
  options: {
    contact_type?: ContactType;
    verification_status?: VerificationStatus;
    membership_status?: MembershipStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ ok: true; contacts: Contact[]; count: number } | { ok: false; error: string }> {
  try {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    let query = supabase
      .from("contacts")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspaceId);

    if (options.contact_type) {
      query = query.eq("contact_type", options.contact_type);
    }

    if (options.verification_status) {
      query = query.eq("verification_status", options.verification_status);
    }

    if (options.membership_status) {
      query = query.eq("membership_status", options.membership_status);
    }

    const { data: contacts, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, contacts: contacts || [], count: count || 0 };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Update contact
 */
export async function updateContact(
  contactId: string,
  updates: Partial<Contact>
): Promise<{ ok: true; contact: Contact } | { ok: false; error: string }> {
  try {
    const { data: contact, error } = await supabase
      .from("contacts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", contactId)
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, contact };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Verify contact
 */
export async function verifyContact(
  contactId: string,
  verifiedBy: string
): Promise<{ ok: true; contact: Contact } | { ok: false; error: string }> {
  return updateContact(contactId, {
    verification_status: "verified",
    verified_at: new Date().toISOString(),
    verified_by: verifiedBy,
  });
}

/**
 * Delete contact
 */
export async function deleteContact(
  contactId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ============================================================================
// CONTACT GROUPS CRUD
// ============================================================================

/**
 * Create contact group
 */
export async function createContactGroup(
  workspaceId: string,
  data: {
    name: string;
    description?: string;
    group_type: GroupType;
  },
  createdBy: string
): Promise<{ ok: true; group: ContactGroup } | { ok: false; error: string }> {
  try {
    const { data: group, error } = await supabase
      .from("contact_groups")
      .insert({
        workspace_id: workspaceId,
        ...data,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, group };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Get contact group
 */
export async function getContactGroup(
  groupId: string
): Promise<{ ok: true; group: ContactGroup } | { ok: false; error: string }> {
  try {
    const { data: group, error } = await supabase
      .from("contact_groups")
      .select()
      .eq("id", groupId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { ok: false, error: "group_not_found" };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true, group };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * List contact groups in workspace
 */
export async function listContactGroups(
  workspaceId: string,
  options: { group_type?: GroupType; limit?: number; offset?: number } = {}
): Promise<{ ok: true; groups: ContactGroup[]; count: number } | { ok: false; error: string }> {
  try {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    let query = supabase
      .from("contact_groups")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspaceId);

    if (options.group_type) {
      query = query.eq("group_type", options.group_type);
    }

    const { data: groups, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, groups: groups || [], count: count || 0 };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Update contact group
 */
export async function updateContactGroup(
  groupId: string,
  updates: Partial<ContactGroup>
): Promise<{ ok: true; group: ContactGroup } | { ok: false; error: string }> {
  try {
    const { data: group, error } = await supabase
      .from("contact_groups")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", groupId)
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, group };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Delete contact group
 */
export async function deleteContactGroup(
  groupId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await supabase
      .from("contact_groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ============================================================================
// GROUP MEMBERSHIP
// ============================================================================

/**
 * Add contact to group
 */
export async function addContactToGroup(
  contactId: string,
  groupId: string,
  addedBy: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await supabase
      .from("contact_group_members")
      .insert({
        contact_id: contactId,
        group_id: groupId,
        added_by: addedBy,
      });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Remove contact from group
 */
export async function removeContactFromGroup(
  contactId: string,
  groupId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await supabase
      .from("contact_group_members")
      .delete()
      .eq("contact_id", contactId)
      .eq("group_id", groupId);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * List group members
 */
export async function listGroupMembers(
  groupId: string
): Promise<{ ok: true; members: Contact[] } | { ok: false; error: string }> {
  try {
    const { data: members, error } = await supabase
      .from("contact_group_members")
      .select("contacts(*)")
      .eq("group_id", groupId);

    if (error) {
      return { ok: false, error: error.message };
    }

    const contacts = members?.map((m: any) => m.contacts).filter(Boolean) || [];
    return { ok: true, members: contacts };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ============================================================================
// CONTACT PERMISSIONS
// ============================================================================

/**
 * Grant permission to contact
 */
export async function grantContactPermission(
  workspaceId: string,
  userId: string,
  contactId: string,
  options: {
    can_share?: boolean;
    can_view_details?: boolean;
    can_edit?: boolean;
  },
  grantedBy: string
): Promise<{ ok: true; permission: ContactPermission } | { ok: false; error: string }> {
  try {
    const { data: permission, error } = await supabase
      .from("contact_permissions")
      .upsert({
        workspace_id: workspaceId,
        user_id: userId,
        contact_id: contactId,
        can_share: options.can_share !== false,
        can_view_details: options.can_view_details !== false,
        can_edit: options.can_edit || false,
        granted_by: grantedBy,
        granted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, permission };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Check user permission for contact
 */
export async function checkContactPermission(
  userId: string,
  contactId: string,
  permissionType: "can_view_details" | "can_share" | "can_edit"
): Promise<boolean> {
  try {
    const { data: permission, error } = await supabase
      .from("contact_permissions")
      .select(permissionType)
      .eq("user_id", userId)
      .eq("contact_id", contactId)
      .single();

    if (error || !permission) {
      return false;
    }

    return permission[permissionType] === true;
  } catch {
    return false;
  }
}

/**
 * Revoke contact permission
 */
export async function revokeContactPermission(
  workspaceId: string,
  userId: string,
  contactId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await supabase
      .from("contact_permissions")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("contact_id", contactId);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Get all permissions for a contact
 */
export async function getContactPermissions(
  contactId: string
): Promise<{ ok: true; permissions: ContactPermission[] } | { ok: false; error: string }> {
  try {
    const { data: permissions, error } = await supabase
      .from("contact_permissions")
      .select()
      .eq("contact_id", contactId);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, permissions: permissions || [] };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
