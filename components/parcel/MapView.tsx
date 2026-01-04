"use client";

import * as React from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

type MapViewProps = {
  height?: number;
  onMapClick?: (lat: number, lng: number) => void;
};

function MapView({ height = 240, onMapClick }: MapViewProps) {
  const [clickedLocation, setClickedLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [viewState, setViewState] = React.useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 9,
  });

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
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        style={{ width: "100%", height }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        cursor={onMapClick ? "crosshair" : "grab"}
      >
        <NavigationControl position="top-right" />
        
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
