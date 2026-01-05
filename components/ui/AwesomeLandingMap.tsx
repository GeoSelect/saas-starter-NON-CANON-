
import dynamic from "next/dynamic";
import React from "react";
import { AwesomeOverlayLayers } from "./AwesomeOverlayLayers";

const MapLibreGL = dynamic(() => import("react-map-gl"), { ssr: false });

export function AwesomeLandingMap() {
  // Example: Centered on San Francisco
  const [viewState, setViewState] = React.useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12,
    pitch: 45,
    bearing: 20,
  });

  return (
    <div style={{ width: "100%", height: 400, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.10)" }}>
      <MapLibreGL
        {...viewState}
        mapStyle="https://tiles.stadiamaps.com/styles/outdoors.json" // Typography basemap always on
        style={{ width: "100%", height: "100%" }}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        <AwesomeOverlayLayers />
      </MapLibreGL>
    </div>
  );
}
