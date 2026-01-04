import { NextResponse } from "next/server";
import { z } from "zod";

const ResolveRequestSchema = z.object({
  query: z.string().min(1).optional(),
  mode: z.enum(["text", "apn", "latlng"]).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  limit: z.number().int().positive().max(50).optional(),
});

const stubResult = {
  id: "parcel_R0076543",
  address: "4127 Linden St, Fort Collins, CO 80524",
  apn: "R0076543",
  jurisdiction: "City of Fort Collins, Larimer County, CO",
  zoning: "NCM — Neighborhood Conservation Medium Density",
  land_use: "Single-Family Residential",
  acreage: 0.18,
  notes: "Verify ADU standards and any historic district guidelines before exterior work.",
  sources: [
    "Larimer County Assessor — Property Record Search",
    "City of Fort Collins — Zoning Map / District Lookup",
    "FEMA Flood Map Service Center",
    "Colorado State Forest Service — Wildfire Risk Resources",
  ],
  owner: "LINDEN STREET PROPERTIES LLC",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ResolveRequestSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          issue: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { query, lat, lng } = parsed.data;

  if (!query && (lat === undefined || lng === undefined)) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Provide either query or lat/lng",
      },
      { status: 400 }
    );
  }

  // Stubbed response; replace with real lookup when backend is ready.
  return NextResponse.json(
    {
      results: [stubResult],
      meta: { count: 1, stubbed: true },
    },
    { status: 200 }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
