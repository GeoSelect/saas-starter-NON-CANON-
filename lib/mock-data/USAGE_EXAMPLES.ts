/**
 * Example usage of mock data throughout the app
 * This file demonstrates how to import and use mock data in your components and APIs
 */

// ============================================
// 1. Using Mock Users
// ============================================
import {
  mockUsers,
  getMockUserById,
  getMockUserByEmail,
  getActiveMockUsers,
  searchMockUsers,
} from "@/lib/mock-data/users";

// Get all users
const allUsers = mockUsers;

// Get specific user by ID
const user = getMockUserById("user-001");

// Get user by email
const userByEmail = getMockUserByEmail("peter@geoselect.com");

// Get only active users
const activeUsers = getActiveMockUsers();

// Search for users by name
const searchResults = searchMockUsers("Peter");

// ============================================
// 2. Using Mock Addresses
// ============================================
import {
  mockAddresses,
  searchMockAddresses,
  getMockAddressByCoordinates,
} from "@/lib/mock-data/addresses";

// Get all addresses
const allAddresses = mockAddresses;

// Search for address by query
const addressResults = searchMockAddresses("Telluride");

// Get address near coordinates
const nearbyAddress = getMockAddressByCoordinates(37.9377, -107.8123);

// ============================================
// 3. Using Mock Parcels
// ============================================
import {
  mockParcels,
  getAllMockParcels,
  getMockParcelById,
  getMockParcelByApn,
  searchMockParcelsByAddress,
  getMockParcelsByCounty,
  getMockParcelsByOwner,
  getMockParcelsNearCoordinates,
  getMockParcelsByZoning,
  getMockParcelsByValuation,
} from "@/lib/mock-data/parcels";

// Get all parcels
const allParcels = getAllMockParcels();

// Get parcel by ID
const parcel = getMockParcelById("parcel-001");

// Get parcel by APN
const parcelByApn = getMockParcelByApn("147-123-456");

// Search parcels by address
const addressParcelResults = searchMockParcelsByAddress("Main Street");

// Get parcels by county
const countyParcels = getMockParcelsByCounty("San Miguel");

// Get parcels by owner name
const ownerParcels = getMockParcelsByOwner("Smith");

// Get parcels near coordinates
const nearbyParcels = getMockParcelsNearCoordinates(37.9377, -107.8123, 5);

// Get parcels by zoning
const zoningParcels = getMockParcelsByZoning("RES-1");

// Get parcels within valuation range
const valuationParcels = getMockParcelsByValuation(1000000, 3000000);

// ============================================
// 4. Using Mock Workspaces
// ============================================
import {
  mockWorkspaces,
  getMockWorkspaceById,
  getActiveMockWorkspaces,
  getMockWorkspacesForUser,
  getMockWorkspaceMembers,
  getMockUserWorkspaceRole,
  hasMockUserEntitlement,
} from "@/lib/mock-data/workspaces";

// Get all workspaces
const allWorkspaces = mockWorkspaces;

// Get specific workspace
const workspace = getMockWorkspaceById("workspace-001");

// Get active workspaces
const activeWorkspaces = getActiveMockWorkspaces();

// Get workspaces for a user
const userWorkspaces = getMockWorkspacesForUser("user-001");

// Get members in a workspace
const workspaceMembers = getMockWorkspaceMembers("workspace-001");

// Get user's role in workspace
const userRole = getMockUserWorkspaceRole("user-001", "workspace-001");

// Check if user has specific entitlement
const hasPermission = hasMockUserEntitlement(
  "user-001",
  "workspace-001",
  "can_resolve_parcels"
);

// ============================================
// 5. Usage in API Endpoints
// ============================================
// Example: GET /api/parcels/all
async function getAllParcelsAPI() {
  return {
    success: true,
    data: getAllMockParcels(),
  };
}

// Example: GET /api/users/search?q=peter
async function searchUsersAPI(query: string) {
  return {
    success: true,
    data: searchMockUsers(query),
  };
}

// ============================================
// 6. Usage in React Components
// ============================================
// Example React component using mock data:
/*
"use client";

import { getAllMockParcels } from '@/lib/mock-data/parcels';

export function ParcelList() {
  const parcels = getAllMockParcels();

  return (
    <div>
      {parcels.map((parcel) => (
        <div key={parcel.id}>
          <h3>{parcel.address}</h3>
          <p>Owner: {parcel.owner.name}</p>
          <p>Value: ${parcel.valuation.estimatedValue.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
*/

// ============================================
// 7. Usage in Server Components
// ============================================
// Example server component:
/*
import { getMockParcelById } from '@/lib/mock-data/parcels';

export default async function ParcelDetail({ id }: { id: string }) {
  const parcel = getMockParcelById(id);

  if (!parcel) {
    return <div>Parcel not found</div>;
  }

  return (
    <div>
      <h1>{parcel.address}</h1>
      <p>County: {parcel.county}</p>
      <p>Owner: {parcel.owner.name}</p>
      <p>Estimated Value: ${parcel.valuation.estimatedValue}</p>
    </div>
  );
}
*/

export const exampleUsage = {
  allUsers,
  user,
  userByEmail,
  activeUsers,
  searchResults,
  allAddresses,
  addressResults,
  nearbyAddress,
  allParcels,
  parcel,
  parcelByApn,
  addressParcelResults,
  countyParcels,
  ownerParcels,
  nearbyParcels,
  zoningParcels,
  valuationParcels,
  allWorkspaces,
  workspace,
  activeWorkspaces,
  userWorkspaces,
  workspaceMembers,
  userRole,
  hasPermission,
};
