import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config(); // Also load .env

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Sample parcels with real coordinates for Street View
const sampleParcels = [
  {
    id: "parcel-1",
    address: "1600 Amphitheatre Parkway, Mountain View, CA 94043",
    jurisdiction: "Mountain View",
    zoning: "C-2",
    apn: "168-41-085",
    sources: ["Assessor", "Zoning"],
    notes: "Google HQ - Mountain View Campus",
    lat: 37.4224764,
    lng: -122.0842499,
  },
  {
    id: "parcel-2",
    address: "1 Apple Park Way, Cupertino, CA 95014",
    jurisdiction: "Cupertino",
    zoning: "P(General)",
    apn: "359-1-001",
    sources: ["Assessor"],
    notes: "Apple Park - Corporate Headquarters",
    lat: 37.3349285,
    lng: -122.0090211,
  },
  {
    id: "parcel-3",
    address: "101 Hudson Street, Jersey City, NJ 07302",
    jurisdiction: "Jersey City",
    zoning: "Mixed Use",
    apn: "B03-P-011",
    sources: ["Assessor"],
    notes: "Goldman Sachs Headquarters",
    lat: 40.7173162,
    lng: -74.0113616,
  },
  {
    id: "parcel-4",
    address: "60 East 42nd Street, New York, NY 10165",
    jurisdiction: "New York",
    zoning: "C5-2",
    apn: "MN-2567-001",
    sources: ["Assessor", "Zoning"],
    notes: "Grand Central Terminal area",
    lat: 40.7527621,
    lng: -73.9772471,
  },
  {
    id: "parcel-5",
    address: "650 Fifth Avenue, New York, NY 10019",
    jurisdiction: "New York",
    zoning: "C5-4",
    apn: "MN-1234-005",
    sources: ["Assessor"],
    notes: "Manhattan office tower",
    lat: 40.7614,
    lng: -73.9776,
  },
];

async function seedParcels() {
  try {
    console.log("Seeding parcels table with sample data...");

    const { data, error } = await supabase.from("parcels").upsert(sampleParcels);

    if (error) {
      console.error("Error seeding parcels:", error);
      process.exit(1);
    }

    console.log(`✓ Successfully seeded ${sampleParcels.length} parcels`);
    process.exit(0);
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
}

seedParcels();
