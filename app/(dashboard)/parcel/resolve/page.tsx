"use client";

import * as React from "react";
import { ArrowRight, Info, MapPin, ShieldAlert, Sparkles, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ParcelList } from "@/components/parcel/ParcelList";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ParcelDetailsSheet } from "@/components/parcel/ParcelDetailsSheet";
import { MapView } from "@/components/parcel/MapView";
import { useParcelResolve } from "@/components/parcel/useParcelResolve";
import { useGeolocation } from "@/components/parcel/useGeolocation";
import { SnapshotWarningDialog } from "@/components/parcel/SnapshotWarningDialog";

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
    handleMapClick,
    openParcel,
    createReport,
    createSnapshot,
    gatedAction,
  } = useParcelResolve();

  const { requestLocation, loading: geoLoading } = useGeolocation();

  React.useEffect(() => {
    void handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showSnapshotDialog, setShowSnapshotDialog] = React.useState(false);

  async function handleUseMyLocation() {
    const location = await requestLocation();
    if (location) {
      await handleMapClick(location.lat, location.lng);
    }
  }

  async function handleCreateSnapshot(notesText: string) {
    // TODO: Get workspace ID from context/params
    const workspaceId = "demo-workspace";
    await createSnapshot(workspaceId, notesText);
    setShowSnapshotDialog(false);
  }

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

            <Button 
              variant="outline" 
              onClick={() => void handleUseMyLocation()} 
              disabled={geoLoading || loading}
              className="w-full gap-2"
            >
              {geoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Use my location
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Interactive Map</CardTitle>
            <p className="text-xs text-muted-foreground">Click anywhere to search for parcels</p>
          </CardHeader>
          <CardContent>
            <MapView height={300} onMapClick={handleMapClick} />
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
                <span>Click the map or search by address/APN</span>
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
            <p className="text-xs text-muted-foreground">Expand a parcel to view details.</p>
          </CardHeader>
          <CardContent className="h-full">
            {loading ? (
              <ParcelList parcels={[]} loading={true} onSelect={() => {}} variant="desktop" />
            ) : parcels.length === 0 ? (
              <div className="text-sm text-muted-foreground">No parcels found.</div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {parcels.map((parcel) => (
                  <AccordionItem key={parcel.id} value={parcel.id}>
                    <AccordionTrigger>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-sm">{parcel.address}</span>
                        <span className="text-xs text-muted-foreground">APN {parcel.apn}</span>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{parcel.jurisdiction}</Badge>
                          <Badge variant="secondary">{parcel.zoning}</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ParcelDetailsSheet
                        open={true}
                        onOpenChange={() => {}}
                        parcel={parcel}
                        onCreateReport={createReport}
                        onGatedAction={gatedAction}
                        variant="desktop"
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
