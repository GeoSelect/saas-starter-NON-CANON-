"use client";

import * as React from "react";
import Map, { Marker, NavigationControl, Source, Layer, MapRef } from "react-map-gl/maplibre";
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
import { MapPin, AlertCircle, Loader2 } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LngLatBoundsLike } from "maplibre-gl";

/**
 * Represents a GeoJSON Feature with a Polygon geometry
 * Used for displaying parcel boundaries on the map
 */
export type ParcelBoundary = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: Record<string, any>;
};

/**
 * Configuration for basemap styles
 */
export type BasemapOption = {
  label: string;
  value: string;
};

/**
 * Coordinate pair for geographic locations
 */
export type Coordinate = {
  lat: number;
  lng: number;
};

/**
 * Props for the MapView component
 */
export type MapViewProps = {
  /** Height of the map container in pixels */
  height?: number;
  /** Callback fired when the map is clicked, receives lat/lng coordinates */
  onMapClick?: (lat: number, lng: number) => void;
  /** Optional parcel boundary to display as a polygon overlay */
  parcelBoundary?: ParcelBoundary | null;
  /** Optional center point to focus the map on */
  parcelCenter?: Coordinate | null;
  /** Initial map center (defaults to Telluride, CO) */
  initialCenter?: Coordinate;
  /** Initial zoom level (defaults to 14) */
  initialZoom?: number;
  /** Custom basemap options (uses defaults if not provided) */
  basemapOptions?: BasemapOption[];
  /** Show/hide the basemap selector control */
  showBasemapSelector?: boolean;
  /** Show/hide pitch and bearing controls */
  showTerrainControls?: boolean;
  /** Enable/disable street view integration */
  enableStreetView?: boolean;
  /** Custom class name for the card wrapper */
  className?: string;
};



/**
 * MapView Component
 * 
 * A comprehensive map component built with MapLibre GL JS and react-map-gl.
 * Provides interactive mapping with support for:
 * - Multiple basemap styles (Light, Dark, Streets, 3D Buildings, Topography)
 * - Parcel boundary visualization with GeoJSON
 * - Interactive click handlers with reverse geocoding
 * - Street view integration
 * - 3D terrain controls (pitch and bearing)
 * - Responsive design for all screen sizes
 * - Proper error handling and loading states
 * 
 * @example
 * ```tsx
 * <MapView
 *   height={400}
 *   parcelCenter={{ lat: 37.9375, lng: -107.8123 }}
 *   onMapClick={(lat, lng) => console.log(`Clicked: ${lat}, ${lng}`)}
 * />
 * ```
 */
function MapView({
  height = 240,
  onMapClick,
  parcelBoundary,
  parcelCenter,
  initialCenter = { lat: 37.9375, lng: -107.8123 }, // Telluride, CO
  initialZoom = 14,
  basemapOptions: customBasemapOptions,
  showBasemapSelector = true,
  showTerrainControls = true,
  enableStreetView = true,
  className = "",
}: MapViewProps) {
  // Map reference with proper typing
  const mapRef = React.useRef<MapRef>(null);
  
  // State management
  const [clickedLocation, setClickedLocation] = React.useState<Coordinate | null>(null);
  const [resolvedAddress, setResolvedAddress] = React.useState<string>("");
  const [streetViewOpen, setStreetViewOpen] = React.useState(false);
  const [propertyCardOpen, setPropertyCardOpen] = React.useState(false);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = React.useState(true);
  const [isGeocodingLoading, setIsGeocodingLoading] = React.useState(false);

  const [viewState, setViewState] = React.useState({
    longitude: initialCenter.lng,
    latitude: initialCenter.lat,
    zoom: initialZoom,
  });

  // Default basemap styles with fallback options
  const defaultBasemapOptions: BasemapOption[] = [
    { label: "Light", value: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
    { label: "Dark", value: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
    { label: "Streets", value: "https://demotiles.maplibre.org/style.json" },
    { label: "3D Buildings", value: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json" },
    { label: "Topography", value: "https://tiles.stadiamaps.com/styles/outdoors.json" },
  ];
  
  const basemapOptions = customBasemapOptions || defaultBasemapOptions;
  const [mapStyle, setMapStyle] = React.useState(basemapOptions[4].value); // Default to Topography

  // Pitch and bearing controls for 3D visualization
  const [pitch, setPitch] = React.useState(0);
  const [bearing, setBearing] = React.useState(0);

  // Zoom to parcel bounds when boundary is provided with error handling
  React.useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    try {
      if (parcelBoundary?.geometry?.coordinates?.[0]) {
        // Calculate bounds from polygon coordinates
        const coords = parcelBoundary.geometry.coordinates[0];
        
        if (coords.length === 0) {
          console.warn("Parcel boundary has no coordinates");
          return;
        }

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
      } else if (parcelCenter) {
        // If we have center but no boundary, just zoom to center
        map.flyTo({
          center: [parcelCenter.lng, parcelCenter.lat],
          zoom: 16,
          duration: 1000,
        });
      }
    } catch (err) {
      console.error("Failed to fit bounds:", err);
      setMapError("Failed to zoom to parcel location");
    }
  }, [parcelBoundary, parcelCenter]);

  // Cleanup on unmount - properly remove map instance
  React.useEffect(() => {
    return () => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        if (map && typeof map.remove === 'function') {
          try {
            map.remove();
          } catch (err) {
            console.warn("Error during map cleanup:", err);
          }
        }
      }
    };
  }, []);

  /**
   * Reverse geocode a lat/lng coordinate to an address using Google Maps API
   * Includes proper error handling and loading states
   */
  async function reverseGeocode(lat: number, lng: number): Promise<void> {
    setIsGeocodingLoading(true);
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
      
      if (!apiKey) {
        console.warn("Google Maps API key not configured");
        setResolvedAddress("Address lookup unavailable");
        setPropertyCardOpen(true);
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Geocoding API returned ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.status === "OK" && data.results.length > 0) {
        setResolvedAddress(data.results[0].formatted_address);
      } else if (data.status === "ZERO_RESULTS") {
        setResolvedAddress("No address found for this location");
      } else {
        setResolvedAddress(`Address lookup failed: ${data.status}`);
      }
      
      setPropertyCardOpen(true);
    } catch (err) {
      console.error("Geocoding error:", err);
      setResolvedAddress("Error resolving address");
      setPropertyCardOpen(true);
    } finally {
      setIsGeocodingLoading(false);
    }
  }

  /**
   * Handle map click events with proper error handling
   */
  const handleMapClick = async (event: any): Promise<void> => {
    const { lngLat } = event;
    
    if (!lngLat) {
      console.warn("Map click event missing lngLat");
      return;
    }

    try {
      const lat = lngLat.lat;
      const lng = lngLat.lng;

      setClickedLocation({ lat, lng });
      
      if (onMapClick) {
        onMapClick(lat, lng);
      }
      
      await reverseGeocode(lat, lng);
      
      if (enableStreetView) {
        setStreetViewOpen(true);
      }
    } catch (err) {
      console.error("Error handling map click:", err);
      setMapError("Failed to process map click");
    }
  };

  /**
   * Handle map load event
   */
  const handleMapLoad = () => {
    setIsMapLoading(false);
    setMapError(null);
  };

  /**
   * Handle map error events
   */
  const handleMapError = (event: any) => {
    console.error("Map error:", event.error);
    setMapError("Failed to load map. Please try refreshing the page.");
    setIsMapLoading(false);
  };

  // Minimal parcel object for the property card
  const minimalParcel = clickedLocation
    ? {
        id: `${clickedLocation.lat},${clickedLocation.lng}`,
        address: resolvedAddress || "Resolving...",
        jurisdiction: "Unknown",
        zoning: "Unknown",
        apn: "N/A",
        sources: ["Google Maps"],
        notes: "Location selected from map.",
        lat: clickedLocation.lat,
        lng: clickedLocation.lng,
      }
    : null;

  return (
    <>
      <Card className={`overflow-hidden ${className}`}>
        {/* Error banner */}
        {mapError && (
          <div className="bg-destructive/10 border-b border-destructive/20 p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{mapError}</span>
          </div>
        )}
        
        {/* Basemap selector and controls */}
        {showBasemapSelector && (
          <div className="flex flex-wrap gap-2 p-2 bg-white border-b">
            <label htmlFor="basemap-select" className="text-sm font-medium flex items-center">
              Basemap:
            </label>
            <select
              id="basemap-select"
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              className="border rounded px-2 py-1 text-sm flex-shrink-0"
              aria-label="Select basemap style"
            >
              {basemapOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            
            {/* Pitch and bearing controls for 3D/topography */}
            {showTerrainControls && (
              <>
                <label className="ml-2 md:ml-4 text-sm font-medium flex items-center">
                  Tilt:
                </label>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-16 md:w-24"
                  aria-label="Adjust map tilt"
                />
                <label className="ml-2 text-sm font-medium flex items-center">
                  Rotate:
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={bearing}
                  onChange={(e) => setBearing(Number(e.target.value))}
                  className="w-16 md:w-24"
                  aria-label="Adjust map rotation"
                />
              </>
            )}
          </div>
        )}
        
        {/* Map container */}
        <div className="relative" style={{ height }}>
          {isMapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
          
          <Map
            ref={mapRef}
            {...viewState}
            pitch={pitch}
            bearing={bearing}
            onMove={(evt) => setViewState(evt.viewState)}
            onClick={handleMapClick}
            onLoad={handleMapLoad}
            onError={handleMapError}
            style={{ width: "100%", height: "100%" }}
            mapStyle={mapStyle}
            cursor={onMapClick ? "crosshair" : "grab"}
            attributionControl={false}
            reuseMaps
          >
            <NavigationControl position="top-right" showCompass showZoom />

            {/* Parcel boundary polygon */}
            {parcelBoundary && (
              <Source id="parcel-boundary" type="geojson" data={parcelBoundary}>
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

            {/* Clicked location marker */}
            {clickedLocation && (
              <Marker
                longitude={clickedLocation.lng}
                latitude={clickedLocation.lat}
                anchor="bottom"
              >
                <MapPin className="h-8 w-8 text-primary drop-shadow-lg" />
              </Marker>
            )}
          </Map>
        </div>
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
      {enableStreetView && (
        <Sheet open={streetViewOpen} onOpenChange={setStreetViewOpen}>
          <SheetContent side="bottom" className="p-0 max-h-[80vh] flex flex-col">
            <SheetHeader className="p-4">
              <SheetTitle>Street View</SheetTitle>
            </SheetHeader>
            <div className="w-full h-[60vh]">
              {clickedLocation && process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
                <iframe
                  title="Google Street View"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&location=${clickedLocation.lat},${clickedLocation.lng}&heading=210&pitch=10&fov=80`}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <p className="text-sm text-muted-foreground">
                    Street View unavailable
                  </p>
                </div>
              )}
            </div>
            <SheetClose className="absolute top-2 right-2" />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

export { MapView };
export type { MapViewProps, BasemapOption, Coordinate };
