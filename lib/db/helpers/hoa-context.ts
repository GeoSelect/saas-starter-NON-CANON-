import { createClient } from '@/lib/supabase/server';

export interface HOAContext {
  id: string;
  name: string;
  jurisdiction: string;
  arc_required: boolean;
  has_ccrs: boolean;
  contact_email?:  string;
  contact_phone?:  string;
  metadata:  Record<string, any>;
}

export interface JurisdictionContext {
  id: string;
  name: string;
  type: 'city' | 'county' | 'state';
  zoning_code?:  string;
  building_code?: string;
  metadata: Record<string, any>;
}

export interface ParcelContext {
  parcel_id: string;
  hoa?:  HOAContext;
  jurisdiction?:  JurisdictionContext;
  zoning:  string;
  apn: string;
  address: string;
}

export async function loadParcelContext(
  parcelId: string,
  workspaceId: string
): Promise<ParcelContext> {
  const supabase = await createClient();

  // Fetch parcel with HOA and jurisdiction
  const { data:  parcel, error } = await supabase
    .from('parcels')
    .select(`
      *,
      hoas (*),
      jurisdictions (*)
    `)
    .eq('id', parcelId)
    .single();

  if (error) throw error;

  return {
    parcel_id:  parcel.id,
    hoa: parcel.hoas ?  {
      id: parcel. hoas. id,
      name: parcel.hoas.name,
      jurisdiction: parcel.hoas. jurisdiction,
      arc_required: parcel.hoas.arc_required || false,
      has_ccrs: parcel.hoas.has_ccrs || false,
      contact_email: parcel.hoas.contact_email,
      contact_phone: parcel.hoas.contact_phone,
      metadata: parcel.hoas. metadata || {},
    } : undefined,
    jurisdiction: parcel.jurisdictions ? {
      id: parcel.jurisdictions.id,
      name: parcel.jurisdictions. name,
      type: parcel.jurisdictions.type,
      zoning_code: parcel. jurisdictions.zoning_code,
      building_code: parcel.jurisdictions.building_code,
      metadata: parcel.jurisdictions.metadata || {},
    } : undefined,
    zoning:  parcel.zoning,
    apn: parcel.apn,
    address: parcel. address,
  };
}
