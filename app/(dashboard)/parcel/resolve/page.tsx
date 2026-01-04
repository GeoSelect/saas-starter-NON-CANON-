"use client";

import * as React from "react";
import { ArrowRight, Info, MapPin, ShieldAlert, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ParcelList } from "@/components/parcel/ParcelList";
import { ParcelDetailsSheet } from "@/components/parcel/ParcelDetailsSheet";
import { useParcelResolve } from "@/components/parcel/useParcelResolve";

export default function ParcelResolvePage() {
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

  React.useEffect(() => {
    void handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Parcel IQ
            </CardTitle>
            <p className="text-sm text-muted-foreground">Real-time parcel search with context-aware summaries</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="query">Search by address, city, or APN</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="1600 Amphitheatre Parkway, Mountain View, CA"
                className="h-11"
              />
            </div>

            <Button onClick={() => void handleSearch()} disabled={loading} className="w-full">
              {loading ? "Searching..." : "Search parcels"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <button className="underline decoration-dotted hover:text-foreground">Use my location</button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Search by address or assessor parcel number (APN)</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>View jurisdiction, zoning, and property details</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Save parcels for later or create custom reports</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Results ({parcels.length})</CardTitle>
            <p className="text-xs text-muted-foreground">Scroll to see all matches.</p>
          </CardHeader>
          <CardContent className="h-full">
            <ParcelList parcels={parcels} loading={loading} onSelect={openParcel} variant="desktop" />
          </CardContent>
        </Card>
      </div>

      <ParcelDetailsSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        parcel={active}
        onCreateReport={createReport}
        onGatedAction={gatedAction}
        variant="desktop"
      />
    </div>
  );
}
