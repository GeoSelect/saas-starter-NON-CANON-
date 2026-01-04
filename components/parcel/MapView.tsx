"use client";

import * as React from "react";
import Map, { Marker, NavigationControl, Source, Layer } from "react-map-gl/maplibre";
import { Card } from "@/components/ui/card";
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

  const [viewState, setViewState] = React.useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 9,
  });

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

  const handleMapClick = (event: any) => {
    const { lngLat } = event;
    if (lngLat && onMapClick) {
      const lat = lngLat.lat;
      const lng = lngLat.lng;
      
      setClickedLocation({ latitude: lat, longitude: lng });
      onMapClick(lat, lng);
    }
  };

  return (
    <Card className="overflow-hidden">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        style={{ width: "100%", height }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
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
  );
}

export { MapView };
export type { ParcelBoundary };
