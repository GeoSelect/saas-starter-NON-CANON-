import { NextRequest, NextResponse } from 'next/server';

// Fixture data for Vercel previews
const FIXTURE_PARCELS: Record<string, any> = {
  'parcel-1': {
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
    taxYear: 2024,
    landValue: 300000,
    improvementValue: 150000,
    propertyType: 'Single Family',
    yearBuilt: 1998,
    buildingArea: 2400,
    lotSize: 108900, // square feet
    history: [
      { date: '2023-06-15', event: 'Sale', amount: 450000 },
      { date: '2018-04-10', event: 'Sale', amount: 325000 },
    ],
  },
  'parcel-2': {
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
    taxYear: 2024,
    landValue: 400000,
    improvementValue: 280000,
    propertyType: 'Commercial',
    yearBuilt: 2005,
    buildingArea: 3200,
    lotSize: 78408,
    history: [
      { date: '2024-03-22', event: 'Sale', amount: 680000 },
      { date: '2020-09-12', event: 'Sale', amount: 520000 },
    ],
  },
  'parcel-3': {
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
    taxYear: 2024,
    landValue: 1100000,
    improvementValue: 100000,
    propertyType: 'Agricultural/Vacant',
    yearBuilt: null,
    buildingArea: 0,
    lotSize: 226512,
    history: [
      { date: '2022-11-08', event: 'Sale', amount: 1200000 },
      { date: '2015-06-30', event: 'Sale', amount: 750000 },
    ],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const parcel = FIXTURE_PARCELS[id];

  if (!parcel) {
    return NextResponse.json(
      { error: 'Parcel not found', isFixture: true },
      { status: 404 }
    );
  }

  return NextResponse.json({
    parcel,
    isFixture: true,
  });
}
