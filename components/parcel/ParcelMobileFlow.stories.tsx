"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ParcelList } from "./ParcelList";
import { ParcelSheet } from "./ParcelSheet";
import type { ParcelResult } from "./ParcelDetailsSheet";

const parcels: ParcelResult[] = [
  {
    id: "1",
    address: "1600 Amphitheatre Pkwy, Mountain View, CA",
    jurisdiction: "Mountain View",
    zoning: "C-2",
    apn: "APN-0001",
    sources: ["Assessor", "Zoning"],
    notes: "Demo parcel for flow preview.",
  },
  {
    id: "2",
    address: "1 Apple Park Way, Cupertino, CA",
    jurisdiction: "Cupertino",
    zoning: "P(General)",
    apn: "APN-0002",
    sources: ["Assessor"],
    notes: "Second parcel to show list selection.",
  },
];

export const MobileFlow = () => {
  const [query, setQuery] = React.useState("1600 Amphitheatre");
  const [active, setActive] = React.useState<ParcelResult | null>(parcels[0]);
  const [openSheet, setOpenSheet] = React.useState(true);

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-white p-4">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">Mobile flow</span>
          <span className="rounded-full bg-muted px-2 py-1">Parcel resolve</span>
        </div>
        <h1 className="text-xl font-semibold">Find a parcel</h1>
        <p className="text-sm text-muted-foreground">Storybook-style preview of the flow.</p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="query" className="text-sm">Address or APN</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11"
            />
          </div>
          <Button className="h-11 w-full" disabled>
            Search (demo)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Results ({parcels.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ParcelList
            parcels={parcels}
            loading={false}
            onSelect={(p) => {
              setActive(p);
              setOpenSheet(true);
            }}
            variant="mobile"
          />
        </CardContent>
      </Card>

      <ParcelSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        parcel={active}
        onCreateReport={() => {}}
        onGatedAction={() => {}}
        variant="mobile"
      />
    </div>
  );
};
