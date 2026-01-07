import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ParcelRef = 
  | { parcel_id: string }
  | { apn: string; jurisdiction: string };

export type HoaPacketState = 'created' | 'pending_payment' | 'paid' | 'fulfilled' | 'revoked';

export interface HoaPacketStatus {
  state: HoaPacketState;
  entitled: boolean;
  packet_id?: string;
  download_url?: string;
}

export interface CreatePurchaseParams {
  parcel_ref: string;
  stripe_session_id: string;
  stripe_payment_intent_id?: string;
  amount_cents: number;
  currency: string;
  customer_email: string;
  account_id?: string;
  workspace_id?: string;
  metadata?: Record<string, any>;
}

export interface GrantEntitlementParams {
  user_id: string;
  purchase_id: string;
  parcel_ref: string;
  access_level?: 'full' | 'preview';
}

export interface RevokeEntitlementParams {
  user_id?: string;
  parcel_ref: string;
}

export interface AssertAccessParams {
  user_id: string | null;
  parcel_id: string;
  bearer_token?: string;
}

export interface GetStatusParams {
  session_id: string;
}

/**
 * Normalize parcel reference to deterministic string format
 * Input: { parcel_id: "40023" } → Output: "parcel:40023"
 * Input: { apn: "123-45-678", jurisdiction: "TX" } → "apn:123-45-678|jur:TX"
 */
export function normalizeParcelRef(input: ParcelRef): string {
  if ('parcel_id' in input) {
    return `parcel:${input.parcel_id}`;
  }
  
  if ('apn' in input && 'jurisdiction' in input) {
    return `apn:${input.apn}|jur:${input.jurisdiction}`;
  }
  
  throw new Error('Invalid parcel_ref: must have parcel_id OR (apn + jurisdiction)');
}

// ============================================================================
// 2. CREATE HOA PACKET PURCHASE
// ============================================================================

/**
 * Create purchase record in database
 * Called by webhook after successful payment
 */
export async function createHoaPacketPurchase(
  params: CreatePurchaseParams
): Promise<{ purchase_id: string; stripe_session_id: string }> {
  try {
    const {
      parcel_ref,
      stripe_session_id,
      stripe_payment_intent_id,
      amount_cents,
      currency,
      customer_email,
      account_id,
      workspace_id,
      metadata,
    } = params;

    const { data, error } = await supabase
      .from('hoa_packet_purchases')
      .insert([
        {
          parcel_ref,
          stripe_session_id,
          stripe_payment_intent_id,
          amount_cents,
          currency,
          customer_email,
          user_id: account_id,
          workspace_id,
          status: 'paid',
          metadata,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id, stripe_session_id')
      .single();

    if (error) {
      console.error('[lib/hoa-packet] Error creating purchase:', error);
      throw new Error(`Failed to create purchase: ${error.message}`);
    }

    if (!data) {
      throw new Error('No purchase record returned');
    }

    console.log(
      `[lib/hoa-packet] ✓ Created purchase ${data.id} for session ${stripe_session_id}`
    );

    return {
      purchase_id: data.id,
      stripe_session_id: data.stripe_session_id,
    };
  } catch (error) {
    console.error('[lib/hoa-packet] Exception in createHoaPacketPurchase:', error);
    throw error;
  }
}

// ============================================================================
// 3. GRANT HOA PACKET ENTITLEMENT
// ============================================================================

/**
 * Grant user access to HOA packet (idempotent)
 */
export async function grantHoaPacketEntitlement(
  params: GrantEntitlementParams
): Promise<void> {
  try {
    const {
      user_id,
      purchase_id,
      parcel_ref,
      access_level = 'full',
    } = params;

    const { error } = await supabase
      .from('user_hoa_packet_access')
      .upsert(
        [
          {
            user_id,
            purchase_id,
            parcel_ref,
            access_level,
            revoked_at: null,
            created_at: new Date().toISOString(),
          },
        ],
        {
          onConflict: 'user_id,purchase_id',
        }
      );

    if (error) {
      console.error('[lib/hoa-packet] Error granting entitlement:', error);
      throw new Error(`Failed to grant entitlement: ${error.message}`);
    }

    console.log(
      `[lib/hoa-packet] ✓ Granted access to ${user_id} for parcel ${parcel_ref}`
    );
  } catch (error) {
    console.error('[lib/hoa-packet] Exception in grantHoaPacketEntitlement:', error);
    throw error;
  }
}

// ============================================================================
// 4. REVOKE HOA PACKET ENTITLEMENT
// ============================================================================

/**
 * Revoke user's access to HOA packet
 * Marks entitlement as revoked but keeps record for audit
 */
export async function revokeHoaPacketEntitlement(
  params: RevokeEntitlementParams
): Promise<void> {
  try {
    const { user_id, parcel_ref } = params;

    let query = supabase
      .from('user_hoa_packet_access')
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq('parcel_ref', parcel_ref);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { error } = await query;

    if (error) {
      console.error('[lib/hoa-packet] Error revoking entitlement:', error);
      throw new Error(`Failed to revoke entitlement: ${error.message}`);
    }

    console.log(
      `[lib/hoa-packet] ✓ Revoked access to parcel ${parcel_ref}`
    );
  } catch (error) {
    console.error('[lib/hoa-packet] Exception in revokeHoaPacketEntitlement:', error);
    throw error;
  }
}

// ============================================================================
// 5. ASSERT HOA PACKET ACCESS (STRICT)
// ============================================================================

/**
 * Enforce access control for HOA packet download
 * Returns { packet_id, parcel_ref } if granted
 * Throws if denied (strict enforcement)
 */
export async function assertHoaPacketAccess(
  params: AssertAccessParams
): Promise<{ packet_id: string; parcel_ref: string }> {
  try {
    const { user_id, parcel_id, bearer_token } = params;

    if (!user_id && bearer_token) {
      throw new Error('Bearer token validation not yet implemented');
    }

    if (!user_id) {
      throw new Error('Unauthorized: no user session or bearer token');
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_tier, role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      return { packet_id: `admin_access_${parcel_id}`, parcel_ref: `parcel:${parcel_id}` };
    }

    if (['basic_buyer', 'pro', 'enterprise'].includes(user.subscription_tier)) {
      return { packet_id: `tier_access_${parcel_id}`, parcel_ref: `parcel:${parcel_id}` };
    }

    const { data: entitlement, error: entitlementError } = await supabase
      .from('user_hoa_packet_access')
      .select('id, parcel_ref, revoked_at')
      .eq('user_id', user_id)
      .eq('parcel_ref', `parcel:${parcel_id}`)
      .single();

    if (entitlementError || !entitlement) {
      throw new Error('Access denied: no entitlement for this parcel');
    }

    if (entitlement.revoked_at) {
      throw new Error('Access denied: entitlement has been revoked');
    }

    return {
      packet_id: `pkt_${parcel_id}`,
      parcel_ref: entitlement.parcel_ref,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[lib/hoa-packet] Access denied: ${message}`);
    throw error;
  }
}

// ============================================================================
// 6. GET HOA PACKET STATUS
// ============================================================================

/**
 * Query authoritative status of HOA packet purchase
 * Safe to call multiple times (GET semantics)
 */
export async function getHoaPacketStatus(
  params: GetStatusParams
): Promise<HoaPacketStatus> {
  try {
    const { session_id } = params;

    if (!session_id) {
      throw new Error('Missing session_id parameter');
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('hoa_packet_purchases')
      .select('*')
      .eq('stripe_session_id', session_id)
      .single();

    if (purchaseError || !purchase) {
      return {
        state: 'created',
        entitled: false,
      };
    }

    let state: HoaPacketState = 'created';
    let entitled = false;

    if (purchase.status === 'paid' || purchase.status === 'completed') {
      state = 'paid';
      entitled = true;
    } else if (purchase.status === 'refunded') {
      state = 'revoked';
      entitled = false;
    } else if (purchase.status === 'pending') {
      state = 'pending_payment';
      entitled = false;
    }

    const response: HoaPacketStatus = {
      state,
      entitled,
    };

    if (purchase.id) {
      response.packet_id = `pkt_${purchase.id}`;
    }

    if (entitled) {
      response.download_url = `/api/parcel/hoa-packet/download?session_id=${session_id}`;
    }

    return response;
  } catch (error) {
    console.error('[lib/hoa-packet] Exception in getHoaPacketStatus:', error);
    throw error;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate idempotency key for purchase session
 * Key format: MD5(user_id + parcel_ref + sku + day)
 */
export function generateIdempotencyKey(
  userId: string | null,
  parcelRef: string,
  sku: string = 'hoa_packet_v1',
  dateOverride?: Date
): string {
  const today = dateOverride || new Date();
  const dateStr = today.toISOString().split('T')[0];

  const key = `${userId || 'anon'}:${parcelRef}:${sku}:${dateStr}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

// ============================================================================
// LEGACY FUNCTIONS (BACKWARD COMPATIBILITY)
// ============================================================================


export async function checkHoaPacketAccess(userId: string | null, parcelId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    // 1. Check user tier
    const { data: user } = await supabase
      .from('users')
      .select('subscription_tier, role')
      .eq('id', userId)
      .single();

    if (!user) return false;

    // Admin has access to everything
    if (user.role === 'admin') return true;

    // basic_buyer, pro, enterprise tiers have access to all HOA packets
    if (['basic_buyer', 'pro', 'enterprise'].includes(user.subscription_tier)) {
      return true;
    }

    // 2. Check if user purchased this specific parcel
    const { data: access } = await supabase
      .from('user_hoa_packet_access')
      .select('id')
      .eq('user_id', userId)
      .eq('parcel_ref', `parcel:${parcelId}`)
      .single();

    return !!access;
  } catch (error) {
    console.error('Error checking HOA packet access:', error);
    return false;
  }
}

/**
 * Get user's purchase history for HOA packets
 */
export async function getUserHoaPacketPurchases(userId: string) {
  try {
    const { data, error } = await supabase
      .from('hoa_packet_purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching HOA packet purchases:', error);
    return [];
  }
}

/**
 * Record download event
 */
export async function recordHoaPacketDownload(purchaseId: string) {
  try {
    const { error } = await supabase
      .from('hoa_packet_purchases')
      .update({ downloaded_at: new Date().toISOString() })
      .eq('id', purchaseId);

    if (error) throw error;
  } catch (error) {
    console.error('Error recording download:', error);
  }
}
