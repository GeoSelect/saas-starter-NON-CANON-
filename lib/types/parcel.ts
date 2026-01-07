/**
 * CCP-04: Parcel Resolution Types
 *
 * Core data structures for parcel intelligence and search
 */

// ---- Parcel Search Input ----
export type ParcelSearchInput = {
  address?: string; // "123 Main St, Telluride, CO"
  parcel_id?: string; // County parcel ID
  latitude?: number; // For coordinate-based search
  longitude?: number;
};

// ---- Parcel Intelligence Output ----
export type ParcelResult = {
  // Identity
  parcel_id: string;
  county: string;
  state: string;

  // Location
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };

  // Ownership
  owner?: {
    name?: string;
    type?: "individual" | "corporation" | "trust" | "other";
    email?: string;
    phone?: string;
    address?: string;
  };

  // Property Details
  property_info?: {
    lot_size_sqft?: number;
    building_sqft?: number;
    year_built?: number;
    stories?: number;
    bedrooms?: number;
    bathrooms?: number;
    garage_type?: string;
    pool?: boolean;
  };

  // Valuation
  valuation?: {
    estimated_value?: number;
    last_sale_price?: number;
    last_sale_date?: string;
    tax_assessed_value?: number;
  };

  // Zoning & Planning
  zoning?: {
    code?: string;
    description?: string;
    use_type?: string;
  };

  // Data Provenance
  sources?: {
    name: string; // "County Assessor", "Zillow", "Google Maps"
    confidence?: "high" | "medium" | "low";
    last_updated?: string;
  }[];

  // UI Hints
  metadata?: {
    resolved_at: string;
    display_address: string;
    summary: string;
  };
};

// ---- API Response Types ----
export type ParcelSearchResponse = {
  success: boolean;
  data?: ParcelResult;
  results?: ParcelResult[]; // For multiple matches
  error?: {
    code: string;
    message: string;
  };
};

// ---- Parcel Report (Integration with CCP-01) ----
export type ParcelReport = {
  id: string;
  user_id: string;
  workspace_id: string;
  parcel_id: string;
  parcel_data: ParcelResult;
  report_type: "Parcel IQ" | "Owner Analysis" | "Value Report" | "Custom";
  title: string;
  description?: string;
  created_at: string;
  shared_with?: {
    email: string;
    shared_at: string;
    viewed_at?: string;
  }[];
  metadata?: Record<string, any>;
};

// ---- Parcel Search Request/Response for API ----
export type SearchParcelRequest = ParcelSearchInput & {
  workspace_id?: string;
};

export type CreateParcelReportRequest = {
  parcel_id: string;
  parcel_data: ParcelResult;
  report_type: string;
  title?: string;
  description?: string;
};
