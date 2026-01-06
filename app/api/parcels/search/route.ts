/**
 * CCP-04: Parcel Search API
 *
 * POST /api/parcels/search
 *
 * Searches for parcel data by address, parcel ID, or coordinates
 * Requires can_resolve_parcels entitlement
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireEntitlement, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware";
import { SearchParcelRequest, ParcelSearchResponse } from "@/lib/types/parcel";

/**
 * Mock parcel data source (replace with real API integration)
 * In production, this would call county assessor APIs, Zillow, Google Maps, etc.
 */
async function resolveParcelFromSources(
  request: SearchParcelRequest
): Promise<ParcelSearchResponse> {
  try {
    // TODO: Integrate with real parcel data sources
    // - County Assessor APIs
    // - Google Maps Geocoding
    // - Zillow API
    // - ArcGIS

    // For now, return mock data for demonstration
    const mockParcel = {
      parcel_id: "mock-123456",
      county: "San Miguel",
      state: "CO",
      address: {
        street: request.address || "123 Mountain View Dr",
        city: "Telluride",
        state: "CO",
        zip: "81435",
        county: "San Miguel",
      },
      coordinates: {
        latitude: request.latitude || 37.9355,
        longitude: request.longitude || -106.9422,
      },
      owner: {
        name: "Sample Owner LLC",
        type: "corporation" as const,
        address: "PO Box 123, Telluride, CO 81435",
      },
      property_info: {
        lot_size_sqft: 45000,
        building_sqft: 5200,
        year_built: 1995,
        stories: 2,
        bedrooms: 4,
        bathrooms: 3,
        garage_type: "attached",
        pool: true,
      },
      valuation: {
        estimated_value: 2500000,
        last_sale_price: 2300000,
        last_sale_date: "2022-06-15",
        tax_assessed_value: 1850000,
      },
      zoning: {
        code: "RES-2",
        description: "Residential Zone 2",
        use_type: "Single Family Residence",
      },
      sources: [
        {
          name: "County Assessor",
          confidence: "high" as const,
          last_updated: new Date().toISOString(),
        },
        {
          name: "Google Maps",
          confidence: "high" as const,
          last_updated: new Date().toISOString(),
        },
      ],
      metadata: {
        resolved_at: new Date().toISOString(),
        display_address: "123 Mountain View Dr, Telluride, CO 81435",
        summary: "4BR/3BA residential property in Telluride with pool",
      },
    };

    return {
      success: true,
      data: mockParcel,
    };
  } catch (error) {
    console.error("[resolveParcelFromSources] Error:", error);
    return {
      success: false,
      error: {
        code: "RESOLUTION_ERROR",
        message: "Failed to resolve parcel data",
      },
    };
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Check authentication and entitlement
    const auth = await requireEntitlement(request, "can_resolve_parcels");
    if (!auth) {
      return forbiddenResponse("User does not have permission to resolve parcels");
    }

    // Parse request
    const body = (await request.json()) as SearchParcelRequest;

    // Validate input
    if (!body.address && !body.parcel_id && (!body.latitude || !body.longitude)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Must provide address, parcel_id, or coordinates",
          },
        } as ParcelSearchResponse,
        { status: 400 }
      );
    }

    // Log search activity
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    await supabase.from("user_activity").insert({
      user_id: auth.userId,
      workspace_id: auth.workspaceId,
      activity_type: "parcel_searched",
      resource_type: "parcel",
      metadata: {
        search_type: body.address ? "address" : body.parcel_id ? "parcel_id" : "coordinates",
        search_input: body.address || body.parcel_id || `${body.latitude},${body.longitude}`,
      },
    });

    // Resolve parcel from external sources
    const result = await resolveParcelFromSources(body);

    if (!result.success) {
      return NextResponse.json(result as ParcelSearchResponse, { status: 500 });
    }

    // Log successful resolution
    if (result.data) {
      await supabase.from("user_activity").insert({
        user_id: auth.userId,
        workspace_id: auth.workspaceId,
        activity_type: "parcel_resolved",
        resource_id: result.data.parcel_id,
        resource_type: "parcel",
        metadata: {
          address: result.data.metadata?.display_address,
        },
      });
    }

    return NextResponse.json(result as ParcelSearchResponse, { status: 200 });
  } catch (error) {
    console.error("[POST /api/parcels/search] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      } as ParcelSearchResponse,
      { status: 500 }
    );
  }
}
