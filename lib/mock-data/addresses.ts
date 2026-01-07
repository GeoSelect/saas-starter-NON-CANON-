/**
 * Mock Address Data for Development
 * Use this data when database tables are not yet created
 */

export const mockAddresses = [
  {
    id: "addr-001",
    address: "123 Main Street",
    city: "Telluride",
    state: "CO",
    zip: "81435",
    country: "USA",
    latitude: 37.9377,
    longitude: -107.8123,
    county: "San Miguel",
    fullAddress: "123 Main Street, Telluride, CO 81435",
  },
  {
    id: "addr-002",
    address: "456 Aspen Lane",
    city: "Aspen",
    state: "CO",
    zip: "81611",
    country: "USA",
    latitude: 39.1911,
    longitude: -106.8175,
    county: "Pitkin",
    fullAddress: "456 Aspen Lane, Aspen, CO 81611",
  },
  {
    id: "addr-003",
    address: "789 Summit Drive",
    city: "Vail",
    state: "CO",
    zip: "81657",
    country: "USA",
    latitude: 39.6403,
    longitude: -106.3742,
    county: "Eagle",
    fullAddress: "789 Summit Drive, Vail, CO 81657",
  },
  {
    id: "addr-004",
    address: "321 Mountain View",
    city: "Boulder",
    state: "CO",
    zip: "80301",
    country: "USA",
    latitude: 40.0149,
    longitude: -105.2705,
    county: "Boulder",
    fullAddress: "321 Mountain View, Boulder, CO 80301",
  },
  {
    id: "addr-005",
    address: "654 Pine Ridge",
    city: "Denver",
    state: "CO",
    zip: "80202",
    country: "USA",
    latitude: 39.7392,
    longitude: -104.9903,
    county: "Denver",
    fullAddress: "654 Pine Ridge, Denver, CO 80202",
  },
  {
    id: "addr-006",
    address: "987 Valley Road",
    city: "Fort Collins",
    state: "CO",
    zip: "80521",
    country: "USA",
    latitude: 40.5853,
    longitude: -105.0844,
    county: "Larimer",
    fullAddress: "987 Valley Road, Fort Collins, CO 80521",
  },
  {
    id: "addr-007",
    address: "1100 Park Avenue",
    city: "Colorado Springs",
    state: "CO",
    zip: "80903",
    country: "USA",
    latitude: 38.8339,
    longitude: -104.8202,
    county: "El Paso",
    fullAddress: "1100 Park Avenue, Colorado Springs, CO 80903",
  },
  {
    id: "addr-008",
    address: "2200 Oak Street",
    city: "Durango",
    state: "CO",
    zip: "81301",
    country: "USA",
    latitude: 37.2809,
    longitude: -107.8765,
    county: "La Plata",
    fullAddress: "2200 Oak Street, Durango, CO 81301",
  },
];

/**
 * Search for addresses by query string
 * Matches against full address
 */
export function searchMockAddresses(query: string) {
  const lowerQuery = query.toLowerCase();
  return mockAddresses.filter(
    (addr) =>
      addr.fullAddress.toLowerCase().includes(lowerQuery) ||
      addr.address.toLowerCase().includes(lowerQuery) ||
      addr.city.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get address by coordinate (with tolerance)
 */
export function getMockAddressByCoordinates(lat: number, lng: number, tolerance: number = 0.05) {
  return mockAddresses.find(
    (addr) =>
      Math.abs(addr.latitude - lat) < tolerance && Math.abs(addr.longitude - lng) < tolerance
  );
}
