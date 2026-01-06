/**
 * CCP-04: Parcel Search API
 *
 * POST /api/parcels/search
 *
 * Searches for parcel data by address, parcel ID, or coordinates
 * Requires can_resolve_parcels entitlement
 * Uses mock data from lib/mock-data/parcels.ts
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireEntitlement, forbiddenResponse } from "@/lib/auth/middleware";
import { SearchParcelRequest, ParcelSearchResponse } from "@/lib/types/parcel";
import {
  searchMockParcelsByAddress,
  getMockParcelByApn,
  getMockParcelsNearCoordinates,
} from "@/lib/mock-data/parcels";

/**
 * Resolve parcel from mock data sources
 * In production, this would call county assessor APIs, Zillow, Google Maps, etc.
 */
async function resolveParcelFromSources(
  request: SearchParcelRequest
): Promise<ParcelSearchResponse> {
  try {
    let parcel = null;

    // Search by address
    if (request.address) {
      const results = searchMockParcelsByAddress(request.address);
      parcel = results[0];
    }

    // Search by parcel ID / APN
    if (!parcel && request.parcel_id) {
      parcel = getMockParcelByApn(request.parcel_id);
    }

    // Search by coordinates
    if (!parcel && request.latitude && request.longitude) {
      const results = getMockParcelsNearCoordinates(
        request.latitude,
        request.longitude,
        1
      );
      parcel = results[0];
    }

    if (!parcel) {
      return {
        success: false,
        error: {
          code: "PARCEL_NOT_FOUND",
          message: "No parcel found matching the provided criteria",
        },
      };
    }

    const mockParcel = {
      parcel_id: parcel.parcelId,
      county: parcel.county,
      state: parcel.state,
      address: {
        street: parcel.address,
        city: parcel.address.split(",")[1]?.trim() || "Unknown",
        state: parcel.state,
        zip: "",
        county: parcel.county,
      },
      coordinates: {
        latitude: parcel.latitude,
        longitude: parcel.longitude,
      },
      owner: {
        name: parcel.owner.name,
        type: parcel.owner.type,
        address: `${parcel.owner.email || parcel.owner.phone || "N/A"}`,
      },
      property_info: {
        lot_size_sqft: parcel.propertyInfo.lotSizeSqft,
        building_sqft: parcel.propertyInfo.buildingSqft,
        year_built: parcel.propertyInfo.yearBuilt,
        stories: 1,
        bedrooms: parcel.propertyInfo.bedrooms,
        bathrooms: parcel.propertyInfo.bathrooms,
        garage_type: "unknown",
        pool: parcel.propertyInfo.pool,
      },
      valuation: {
        estimated_value: parcel.valuation.estimatedValue,
        last_sale_price: parcel.valuation.lastSalePrice,
        last_sale_date: parcel.valuation.lastSaleDate,
        tax_assessed_value: parcel.valuation.taxAssessedValue,
      },
      zoning: {
        code: parcel.zoning,
        description: `Zoning: ${parcel.zoning}`,
        use_type: parcel.propertyInfo.propertyType,
      },
      sources: parcel.sources.map((src) => ({
        name: src.name,
        confidence: src.confidence,
        last_updated: new Date().toISOString(),
      })),
      metadata: {
        resolved_at: new Date().toISOString(),
        display_address: parcel.address,
        summary: `${parcel.propertyInfo.bedrooms}BR/${parcel.propertyInfo.bathrooms}BA property in ${parcel.county} County`,
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
    const auth = await requireEntitlement(request, "can_resolve_parcels");
    if (!auth) {
      return forbiddenResponse(
        "User does not have permission to resolve parcels"
      );
    }

    const body = (await request.json()) as SearchParcelRequest;

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
        search_type: body.address
          ? "address"
          : body.parcel_id
            ? "parcel_id"
            : "coordinates",
        search_input:
          body.address ||
          body.parcel_id ||
          `${body.latitude},${body.longitude}`,
      },
    });

    const result = await resolveParcelFromSources(body);

    if (!result.success) {
      return NextResponse.json(result as ParcelSearchResponse, { status: 500 });
    }

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
