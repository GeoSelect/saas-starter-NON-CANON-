import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Check if user has access to download HOA packet for a parcel
 * Returns true if:
 * - User has purchased this specific parcel, OR
 * - User is basic_buyer or higher tier (unlimited access), OR
 * - User is admin
 */
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
      .eq('parcel_id', parcelId)
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
