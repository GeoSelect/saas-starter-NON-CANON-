"use client";

import * as React from "react";
import Map, { Marker, NavigationControl, Source, Layer } from "react-map-gl/maplibre";
import { Card } from "@/components/ui/card";
import { ParcelDetailsSheet } from "./ParcelDetailsSheet";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { MapPin } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LngLatBoundsLike } from "maplibre-gl";

export type ParcelBoundary = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties?: Record<string, any>;
};

type MapViewProps = {
  height?: number;
  onMapClick?: (lat: number, lng: number) => void;
  parcelBoundary?: ParcelBoundary | null;
  parcelCenter?: { lat: number; lng: number } | null;
};



function MapView({ height = 240, onMapClick, parcelBoundary, parcelCenter }: MapViewProps) {
  const mapRef = React.useRef<any>(null);
  const [clickedLocation, setClickedLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [resolvedAddress, setResolvedAddress] = React.useState<string>("");
  const [streetViewOpen, setStreetViewOpen] = React.useState(false);
  const [propertyCardOpen, setPropertyCardOpen] = React.useState(false);

  const [viewState, setViewState] = React.useState({
    longitude: -107.8123, // Telluride, CO
    latitude: 37.9375,    // Telluride, CO
    zoom: 14, // Increased zoom for closer view
  });

  // Basemap styles
  const basemapOptions = [
    { label: "Light", value: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
    { label: "Dark", value: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
    { label: "Streets", value: "https://demotiles.maplibre.org/style.json" },
    { label: "3D Buildings", value: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json" },
    { label: "Topography", value: "https://tiles.stadiamaps.com/styles/outdoors.json" }, // Public topography style
  ];
  const [mapStyle, setMapStyle] = React.useState(basemapOptions[0].value);

  // Pitch and bearing controls
  const [pitch, setPitch] = React.useState(0);
  const [bearing, setBearing] = React.useState(0);

  // Zoom to parcel bounds when boundary is provided
  React.useEffect(() => {
    if (parcelBoundary && mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        try {
          // Calculate bounds from polygon coordinates
          const coords = parcelBoundary.geometry.coordinates[0];
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);

          const bounds: LngLatBoundsLike = [
            [Math.min(...lngs), Math.min(...lats)], // Southwest
            [Math.max(...lngs), Math.max(...lats)], // Northeast
          ];

          map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 17,
            duration: 1000,
          });
        } catch (err) {
          console.warn("Failed to fit bounds:", err);
        }
      }
    } else if (parcelCenter && mapRef.current) {
      // If we have center but no boundary, just zoom to center
      const map = mapRef.current.getMap();
      if (map) {
        map.flyTo({
          center: [parcelCenter.lng, parcelCenter.lat],
          zoom: 16,
          duration: 1000,
        });
      }
    }
  }, [parcelBoundary, parcelCenter]);

  // Reverse geocode using Google Maps API (or other service)
  async function reverseGeocode(lat: number, lng: number) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        setResolvedAddress(data.results[0].formatted_address);
        setPropertyCardOpen(true);
      } else {
        setResolvedAddress("Address not found");
        setPropertyCardOpen(true);
      }
    } catch {
      setResolvedAddress("Error resolving address");
      setPropertyCardOpen(true);
    }
  }

  const handleMapClick = async (event: any) => {
    const { lngLat } = event;
    if (lngLat && onMapClick) {
      const lat = lngLat.lat;
      const lng = lngLat.lng;

      setClickedLocation({ latitude: lat, longitude: lng });
      onMapClick(lat, lng);
      await reverseGeocode(lat, lng);
      setStreetViewOpen(true);
    }
  };

  // Minimal parcel object for the property card
  const minimalParcel = clickedLocation
    ? {
        id: `${clickedLocation.latitude},${clickedLocation.longitude}`,
        address: resolvedAddress || "Resolving...",
        jurisdiction: "Unknown",
        zoning: "Unknown",
        apn: "N/A",
        sources: ["Google Maps"],
        notes: "Location selected from map.",
        lat: clickedLocation.latitude,
        lng: clickedLocation.longitude,
      }
    : null;

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex gap-2 p-2 bg-white border-b">
          <label htmlFor="basemap-select" className="text-sm font-medium">Basemap:</label>
          <select
            id="basemap-select"
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {basemapOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Pitch and bearing controls for 3D/topography */}
          {(mapStyle === basemapOptions[3].value || mapStyle === basemapOptions[4].value) && (
            <>
              <label className="ml-4 text-sm font-medium">Tilt:</label>
              <input
                type="range"
                min={0}
                max={60}
                value={pitch}
                onChange={e => setPitch(Number(e.target.value))}
                className="w-24"
              />
              <label className="ml-2 text-sm font-medium">Rotate:</label>
              <input
                type="range"
                min={0}
                max={360}
                value={bearing}
                onChange={e => setBearing(Number(e.target.value))}
                className="w-24"
              />
            </>
          )}
        </div>
        <Map
          ref={mapRef}
          {...viewState}
          pitch={pitch}
          bearing={bearing}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={handleMapClick}
          style={{ width: "100%", height }}
          mapStyle={mapStyle}
          cursor={onMapClick ? "crosshair" : "grab"}
        >
          <NavigationControl position="top-right" />

          {/* Parcel boundary polygon */}
          {parcelBoundary && (
            <Source
              id="parcel-boundary"
              type="geojson"
              data={parcelBoundary}
            >
              <Layer
                id="parcel-fill"
                type="fill"
                paint={{
                  "fill-color": "hsl(var(--primary))",
                  "fill-opacity": 0.15,
                }}
              />
              <Layer
                id="parcel-outline"
                type="line"
                paint={{
                  "line-color": "hsl(var(--primary))",
                  "line-width": 3,
                }}
              />
            </Source>
          )}

          {/* 3D Buildings Layer (only when 3D Buildings basemap is selected) */}
          {mapStyle === "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json" && (
            <Source
              id="osm-buildings"
              type="vector"
              url="https://tiles.stadiamaps.com/data/osm_buildings.json"
            >
              <Layer
                id="3d-buildings"
                source-layer="osm_buildings"
                type="fill-extrusion"
                paint={{
                  "fill-extrusion-color": "#aaa",
                  "fill-extrusion-height": ["get", "height"],
                  "fill-extrusion-base": 0,
                  "fill-extrusion-opacity": 0.7,
                }}
              />
            </Source>
          )}

          {clickedLocation && (
            <Marker
              longitude={clickedLocation.longitude}
              latitude={clickedLocation.latitude}
              anchor="bottom"
            >
              <MapPin className="h-8 w-8 text-primary drop-shadow-lg" />
            </Marker>
          )}
        </Map>
      </Card>
      {/* Property card pops out automatically after map click */}
      <ParcelDetailsSheet
        open={propertyCardOpen}
        onOpenChange={setPropertyCardOpen}
        parcel={minimalParcel}
        onCreateReport={() => setStreetViewOpen(true)}
        onGatedAction={() => {}}
        variant="mobile"
      />
      {/* Slide-up tray for Street View */}
      <Sheet open={streetViewOpen} onOpenChange={setStreetViewOpen}>
        <SheetContent side="bottom" className="p-0 max-h-[80vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>Street View</SheetTitle>
          </SheetHeader>
          <div className="w-full h-[60vh]">
            {clickedLocation && (
              <iframe
                title="Google Street View"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&location=${clickedLocation.latitude},${clickedLocation.longitude}&heading=210&pitch=10&fov=80`}
              />
            )}
          </div>
          <SheetClose className="absolute top-2 right-2" />
        </SheetContent>
      </Sheet>
    </>
  );
}

export { MapView };
export type { ParcelBoundary };
