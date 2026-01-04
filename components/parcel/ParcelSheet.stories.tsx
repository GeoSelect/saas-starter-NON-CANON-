"use client";

import * as React from "react";
import type { ParcelResult } from "./ParcelDetailsSheet";
import { ParcelSheet } from "./ParcelSheet";

const parcel: ParcelResult = {
  id: "demo-1",
  address: "1600 Amphitheatre Pkwy, Mountain View, CA",
  jurisdiction: "Mountain View",
  zoning: "C-2",
  apn: "APN-0001",
  sources: ["Assessor", "Zoning"],
  notes: "Demo parcel rendered inside the sheet.",
};

export const MobileSheet = () => {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="max-w-sm">
      <ParcelSheet
        open={open}
        onOpenChange={setOpen}
        parcel={parcel}
        onCreateReport={() => {}}
        onGatedAction={() => {}}
        variant="mobile"
      />
    </div>
  );
};

export const DesktopSheet = () => {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="max-w-2xl">
      <ParcelSheet
        open={open}
        onOpenChange={setOpen}
        parcel={parcel}
        onCreateReport={() => {}}
        onGatedAction={() => {}}
        variant="desktop"
      />
    </div>
  );
};
