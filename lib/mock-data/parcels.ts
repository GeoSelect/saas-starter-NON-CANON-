/**
 * Mock Parcel Data for Development
 * Use this data when database tables are not yet created
 */

export const mockParcels = [
  {
    id: "parcel-001",
    address: "123 Main Street, Telluride, CO 81435",
    parcelId: "147-123-456",
    apn: "147-123-456",
    latitude: 37.9377,
    longitude: -107.8123,
    county: "San Miguel",
    state: "CO",
    owner: {
      name: "John Smith LLC",
      type: "corporation",
      email: "john@example.com",
      phone: "+1-303-555-0101",
    },
    propertyInfo: {
      bedrooms: 4,
      bathrooms: 3,
      yearBuilt: 1998,
      lotSizeSqft: 15000,
      buildingSqft: 4500,
      pool: true,
      propertyType: "residential",
    },
    valuation: {
      estimatedValue: 2500000,
      taxAssessedValue: 2200000,
      lastSalePrice: 2300000,
      lastSaleDate: "2022-06-15",
    },
    zoning: "RES-1",
    jurisdiction: "Telluride Town",
    sources: [
      { name: "County Assessor", confidence: "high" },
      { name: "MLS Data", confidence: "high" },
      { name: "Tax Records", confidence: "high" },
    ],
    notes: "Luxury mountain property with mountain views and ski-in access",
  },
  {
    id: "parcel-002",
    address: "456 Aspen Lane, Aspen, CO 81611",
    parcelId: "127-456-789",
    apn: "127-456-789",
    latitude: 39.1911,
    longitude: -106.8175,
    county: "Pitkin",
    state: "CO",
    owner: {
      name: "Aspen Investments Corp",
      type: "corporation",
      email: null,
      phone: null,
    },
    propertyInfo: {
      bedrooms: 5,
      bathrooms: 4,
      yearBuilt: 2005,
      lotSizeSqft: 20000,
      buildingSqft: 6000,
      pool: true,
      propertyType: "residential",
    },
    valuation: {
      estimatedValue: 3500000,
      taxAssessedValue: 3100000,
      lastSalePrice: 3250000,
      lastSaleDate: "2021-09-20",
    },
    zoning: "RES-2",
    jurisdiction: "Aspen City",
    sources: [
      { name: "County Assessor", confidence: "high" },
      { name: "Public Records", confidence: "medium" },
    ],
    notes: "Executive residence near downtown Aspen",
  },
  {
    id: "parcel-003",
    address: "789 Summit Drive, Vail, CO 81657",
    parcelId: "141-789-012",
    apn: "141-789-012",
    latitude: 39.6403,
    longitude: -106.3742,
    county: "Eagle",
    state: "CO",
    owner: {
      name: "Vail Valley Holdings",
      type: "corporation",
      email: "info@vailvalley.com",
      phone: "+1-970-555-0202",
    },
    propertyInfo: {
      bedrooms: 6,
      bathrooms: 5,
      yearBuilt: 2010,
      lotSizeSqft: 25000,
      buildingSqft: 7500,
      pool: true,
      propertyType: "residential",
    },
    valuation: {
      estimatedValue: 4200000,
      taxAssessedValue: 3800000,
      lastSalePrice: 4000000,
      lastSaleDate: "2020-03-10",
    },
    zoning: "RES-3",
    jurisdiction: "Vail Town",
    sources: [
      { name: "County Assessor", confidence: "high" },
      { name: "MLS Data", confidence: "high" },
      { name: "Recent Appraisal", confidence: "high" },
    ],
    notes: "Premier ski-in/ski-out property with guest cottage",
  },
  {
    id: "parcel-004",
    address: "321 Mountain View, Boulder, CO 80301",
    parcelId: "134-321-098",
    apn: "134-321-098",
    latitude: 40.0149,
    longitude: -105.2705,
    county: "Boulder",
    state: "CO",
    owner: {
      name: "Rachel Thompson",
      type: "individual",
      email: "rachel.thompson@example.com",
      phone: "+1-303-555-0303",
    },
    propertyInfo: {
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2015,
      lotSizeSqft: 8000,
      buildingSqft: 2200,
      pool: false,
      propertyType: "residential",
    },
    valuation: {
      estimatedValue: 1200000,
      taxAssessedValue: 1100000,
      lastSalePrice: 1150000,
      lastSaleDate: "2023-01-15",
    },
    zoning: "RES-1",
    jurisdiction: "Boulder City",
    sources: [
      { name: "County Assessor", confidence: "high" },
      { name: "MLS Data", confidence: "high" },
    ],
    notes: "Modern home with Flatirons view",
  },
  {
    id: "parcel-005",
    address: "654 Pine Ridge, Denver, CO 80202",
    parcelId: "148-654-321",
    apn: "148-654-321",
    latitude: 39.7392,
    longitude: -104.9903,
    county: "Denver",
    state: "CO",
    owner: {
      name: "Urban Development LLC",
      type: "corporation",
      email: null,
      phone: "+1-303-555-0404",
    },
    propertyInfo: {
      bedrooms: 2,
      bathrooms: 2,
      yearBuilt: 2018,
      lotSizeSqft: 5000,
      buildingSqft: 1500,
      pool: false,
      propertyType: "commercial",
    },
    valuation: {
      estimatedValue: 850000,
      taxAssessedValue: 750000,
      lastSalePrice: 800000,
      lastSaleDate: "2023-06-01",
    },
    zoning: "COM-2",
    jurisdiction: "Denver City",
    sources: [
      { name: "County Assessor", confidence: "high" },
      { name: "Commercial MLS", confidence: "medium" },
    ],
    notes: "Downtown Denver mixed-use commercial property",
  },
];

/**
 * Get all mock parcels
 */
export function getAllMockParcels() {
  return mockParcels;
}

/**
 * Find parcel by ID
 */
export function getMockParcelById(id: string) {
  return mockParcels.find((parcel) => parcel.id === id);
}

/**
 * Find parcel by APN (Assessor Parcel Number)
 */
export function getMockParcelByApn(apn: string) {
  return mockParcels.find((parcel) => parcel.apn === apn);
}

/**
 * Search parcels by address
 */
export function searchMockParcelsByAddress(address: string) {
  const lowerAddress = address.toLowerCase();
  return mockParcels.filter((parcel) =>
    parcel.address.toLowerCase().includes(lowerAddress)
  );
}

/**
 * Get parcels by county
 */
export function getMockParcelsByCounty(county: string) {
  return mockParcels.filter(
    (parcel) => parcel.county.toLowerCase() === county.toLowerCase()
  );
}

/**
 * Get parcels by owner name
 */
export function getMockParcelsByOwner(ownerName: string) {
  const lowerName = ownerName.toLowerCase();
  return mockParcels.filter((parcel) =>
    parcel.owner.name.toLowerCase().includes(lowerName)
  );
}

/**
 * Get parcels within coordinate range
 */
export function getMockParcelsNearCoordinates(
  latitude: number,
  longitude: number,
  radiusInMiles: number = 5
) {
  // Rough approximation: 1 degree ≈ 69 miles
  const tolerance = radiusInMiles / 69;

  return mockParcels.filter(
    (parcel) =>
      Math.abs(parcel.latitude - latitude) < tolerance &&
      Math.abs(parcel.longitude - longitude) < tolerance
  );
}

/**
 * Get parcels by zoning type
 */
export function getMockParcelsByZoning(zoning: string) {
  return mockParcels.filter((parcel) => parcel.zoning === zoning);
}

/**
 * Get parcels within valuation range
 */
export function getMockParcelsByValuation(minValue: number, maxValue: number) {
  return mockParcels.filter(
    (parcel) =>
      parcel.valuation.estimatedValue >= minValue &&
      parcel.valuation.estimatedValue <= maxValue
  );
}
