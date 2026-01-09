import { NextRequest, NextResponse } from 'next/server';

// Fixture data for Vercel previews
const FIXTURE_PARCELS = [
  {
    id: 'parcel-1',
    address: '123 Main St, Telluride, CO 81435',
    apn: '123-456-789',
    acreage: 2.5,
    zoning: 'Residential',
    owner: 'John Smith',
    assessedValue: 450000,
    lastSaleDate: '2023-06-15',
    latitude: 37.9375,
    longitude: -107.8123,
  },
  {
    id: 'parcel-2',
    address: '456 Oak Ave, Telluride, CO 81435',
    apn: '987-654-321',
    acreage: 1.8,
    zoning: 'Commercial',
    owner: 'Jane Doe',
    assessedValue: 680000,
    lastSaleDate: '2024-03-22',
    latitude: 37.9405,
    longitude: -107.8145,
  },
  {
    id: 'parcel-3',
    address: '789 Mountain View Rd, Telluride, CO 81435',
    apn: '555-123-456',
    acreage: 5.2,
    zoning: 'Agricultural',
    owner: 'Mountain Properties LLC',
    assessedValue: 1200000,
    lastSaleDate: '2022-11-08',
    latitude: 37.9450,
    longitude: -107.8200,
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase();

  let results = FIXTURE_PARCELS;

  // Simple search filtering
  if (query) {
    results = FIXTURE_PARCELS.filter(
      (parcel) =>
        parcel.address.toLowerCase().includes(query) ||
        parcel.apn.includes(query) ||
        parcel.owner.toLowerCase().includes(query) ||
        parcel.zoning.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    parcels: results,
    total: results.length,
    isFixture: true,
  });
}
