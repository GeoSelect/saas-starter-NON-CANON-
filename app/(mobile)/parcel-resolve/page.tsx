"use client";

import * as React from "react";
import { Info, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParcelList } from "@/components/parcel/ParcelList";
import { ParcelSheet } from "@/components/parcel/ParcelSheet";
import { MapView } from "@/components/parcel/MapView";
import { useParcelResolve } from "@/components/parcel/useParcelResolve";

export default function MobileParcelResolvePage() {
  const {
    query,
    setQuery,
    loading,
    parcels,
    active,
    openSheet,
    setOpenSheet,
    handleSearch,
    openParcel,
    createReport,
    gatedAction,
  } = useParcelResolve();

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">Mobile</Badge>
          <Badge className="text-xs">Parcel resolve</Badge>
        </div>
        <h1 className="text-xl font-semibold">Find a parcel</h1>
        <p className="text-sm text-muted-foreground">
          Search by address or APN. Tap a result to see details.
        </p>
      </header>

      <MapView />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MapPin className="h-4 w-4" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="space-y-3" onSubmit={handleSearch}>
            <div className="space-y-1.5">
              <Label htmlFor="query" className="text-sm">Address or APN</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="123 Main St or APN"
                autoComplete="off"
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Stubbed data; replace with your API when ready.</span>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <ParcelList parcels={[]} loading={true} onSelect={openParcel} variant="mobile" />
          </CardContent>
        </Card>
      ) : parcels.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Results ({parcels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ParcelList parcels={parcels} loading={false} onSelect={openParcel} variant="mobile" />
          </CardContent>
        </Card>
      ) : null}

      <ParcelSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        parcel={active}
        onCreateReport={createReport}
        onGatedAction={gatedAction}
        variant="mobile"
      />
    </div>
  );
}
