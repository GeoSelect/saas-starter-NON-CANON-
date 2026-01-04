"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ParcelList } from "@/components/parcel/ParcelList";
import { ParcelSheet } from "@/components/parcel/ParcelSheet";
import { MapView } from "@/components/parcel/MapView";
import { useParcelResolve } from "@/components/parcel/useParcelResolve";

export default function ComponentsGalleryPage() {
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
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-1">Preview</span>
          <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">Component gallery</span>
        </div>
        <h1 className="text-2xl font-bold">Parcel UI gallery</h1>
        <p className="text-sm text-muted-foreground">
          Quick in-app preview of parcel components (list, sheet, map, mobile flow).
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Parcel list (mobile variant)</CardTitle>
            <p className="text-xs text-muted-foreground">Tap a parcel to open the sheet.</p>
          </CardHeader>
          <CardContent>
            <ParcelList parcels={parcels} loading={loading} onSelect={openParcel} variant="mobile" />
            {!loading && parcels.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Run a search to see results.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Map view (client-only)</CardTitle>
            <p className="text-xs text-muted-foreground">OpenLayers placeholder with OSM tiles.</p>
          </CardHeader>
          <CardContent>
            <MapView />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Parcel sheet (toggle variants)</CardTitle>
          <p className="text-xs text-muted-foreground">Mobile and desktop variants share the same component.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <form className="flex flex-1 gap-2" onSubmit={handleSearch}>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search address or APN"
              />
              <Button type="submit" disabled={loading}>{loading ? "Searching" : "Search"}</Button>
            </form>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const sample = "Amphitheatre";
                setQuery(sample);
                void handleSearch(undefined, sample);
              }}
            >
              Example query
            </Button>
            <Button size="sm" onClick={() => setOpenSheet((v) => !v)}>{openSheet ? "Close" : "Open"} sheet</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-semibold">Mobile</p>
              <ParcelSheet
                open={openSheet}
                onOpenChange={setOpenSheet}
                parcel={active}
                onCreateReport={createReport}
                onGatedAction={gatedAction}
                variant="mobile"
              />
            </div>
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-semibold">Desktop</p>
              <ParcelSheet
                open={openSheet}
                onOpenChange={setOpenSheet}
                parcel={active}
                onCreateReport={createReport}
                onGatedAction={gatedAction}
                variant="desktop"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Mobile flow (search → results → sheet)</CardTitle>
          <p className="text-xs text-muted-foreground">Static mock illustrating layout only.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Search</p>
              <p className="text-xs text-muted-foreground">Uses live Supabase parcel search with fallback API.</p>
            </div>
            <hr className="border-muted" />
            <form className="flex flex-col gap-2" onSubmit={handleSearch}>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 1600 Amphitheatre or APN"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Searching" : "Search"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const sample = "Cupertino";
                    setQuery(sample);
                    void handleSearch(undefined, sample);
                  }}
                >
                  Quick try
                </Button>
              </div>
            </form>
            <ParcelList parcels={parcels} loading={loading} onSelect={openParcel} variant="mobile" />
            {!loading && parcels.length === 0 && (
              <p className="text-xs text-muted-foreground">No results yet. Run a query to populate the sheet.</p>
            )}
            <ParcelSheet
              open={openSheet}
              onOpenChange={setOpenSheet}
              parcel={active}
              onCreateReport={createReport}
              onGatedAction={gatedAction}
              variant="mobile"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
