import type { ParcelResult } from "./ParcelDetailsSheet";
import { ParcelList } from "./ParcelList";

const parcels: ParcelResult[] = [
  {
    id: "1",
    address: "1600 Amphitheatre Pkwy, Mountain View, CA",
    jurisdiction: "Mountain View",
    zoning: "C-2",
    apn: "APN-0001",
    sources: ["Assessor", "Zoning"],
    notes: "Demo parcel for Ladle preview.",
  },
  {
    id: "2",
    address: "1 Apple Park Way, Cupertino, CA",
    jurisdiction: "Cupertino",
    zoning: "P(General)",
    apn: "APN-0002",
    sources: ["Assessor"],
    notes: "Second parcel to show list scrolling.",
  },
];

export const Mobile = () => (
  <div className="max-w-sm">
    <ParcelList parcels={parcels} loading={false} onSelect={() => {}} variant="mobile" />
  </div>
);

export const Desktop = () => (
  <div className="max-w-lg">
    <ParcelList parcels={parcels} loading={false} onSelect={() => {}} variant="desktop" />
  </div>
);
