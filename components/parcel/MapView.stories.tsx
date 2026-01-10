"use client";

import { MapView } from "./MapView";
import type { ParcelBoundary } from "./MapView";

/**
 * Default MapView with Telluride, CO as the center
 */
export const Default = () => (
  <div className="max-w-3xl">
    <MapView />
  </div>
);

/**
 * MapView with click handler that shows alerts
 */
export const WithClickHandler = () => (
  <div className="max-w-3xl space-y-4">
    <MapView 
      onMapClick={(lat, lng) => {
        console.log(`Clicked at: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }} 
    />
    <p className="text-sm text-muted-foreground">
      Click anywhere on the map to trigger the callback
    </p>
  </div>
);

/**
 * MapView with custom height
 */
export const CustomHeight = () => (
  <div className="max-w-3xl">
    <MapView height={500} />
  </div>
);

/**
 * MapView with a parcel boundary polygon
 */
export const WithParcelBoundary = () => {
  // Sample parcel boundary around Telluride Town Park
  const parcelBoundary: ParcelBoundary = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-107.8145, 37.9365],
        [-107.8125, 37.9365],
        [-107.8125, 37.9385],
        [-107.8145, 37.9385],
        [-107.8145, 37.9365],
      ]],
    },
    properties: {
      name: "Sample Parcel",
      apn: "123-456-789",
    },
  };

  return (
    <div className="max-w-3xl space-y-4">
      <MapView 
        height={400}
        parcelBoundary={parcelBoundary}
      />
      <p className="text-sm text-muted-foreground">
        The highlighted polygon shows a sample parcel boundary
      </p>
    </div>
  );
};

/**
 * MapView centered on a specific location
 */
export const WithCustomCenter = () => (
  <div className="max-w-3xl space-y-4">
    <MapView 
      height={400}
      parcelCenter={{ lat: 40.7128, lng: -74.0060 }} // New York City
      initialCenter={{ lat: 40.7128, lng: -74.0060 }}
      initialZoom={12}
    />
    <p className="text-sm text-muted-foreground">
      Centered on New York City with custom zoom level
    </p>
  </div>
);

/**
 * MapView without basemap selector
 */
export const MinimalControls = () => (
  <div className="max-w-3xl space-y-4">
    <MapView 
      height={400}
      showBasemapSelector={false}
      showTerrainControls={false}
    />
    <p className="text-sm text-muted-foreground">
      Minimal interface with controls hidden
    </p>
  </div>
);

/**
 * MapView without street view integration
 */
export const WithoutStreetView = () => (
  <div className="max-w-3xl space-y-4">
    <MapView 
      height={400}
      enableStreetView={false}
      onMapClick={(lat, lng) => {
        console.log(`Location: ${lat}, ${lng}`);
      }}
    />
    <p className="text-sm text-muted-foreground">
      Street view disabled - click events still work
    </p>
  </div>
);

/**
 * Full-featured MapView example
 */
export const FullFeatured = () => {
  const parcelBoundary: ParcelBoundary = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-107.8145, 37.9365],
        [-107.8125, 37.9365],
        [-107.8125, 37.9385],
        [-107.8145, 37.9385],
        [-107.8145, 37.9365],
      ]],
    },
    properties: {
      name: "Full Featured Example",
      apn: "555-123-456",
    },
  };

  return (
    <div className="max-w-4xl space-y-4">
      <MapView 
        height={600}
        parcelBoundary={parcelBoundary}
        parcelCenter={{ lat: 37.9375, lng: -107.8135 }}
        onMapClick={(lat, lng) => {
          console.log(`Clicked: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }}
        showBasemapSelector={true}
        showTerrainControls={true}
        enableStreetView={true}
        className="shadow-lg"
      />
      <div className="text-sm text-muted-foreground space-y-2">
        <p className="font-semibold">Features demonstrated:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Parcel boundary visualization</li>
          <li>Basemap style switcher</li>
          <li>3D terrain controls (tilt and rotate)</li>
          <li>Click interaction with reverse geocoding</li>
          <li>Street view integration</li>
          <li>Navigation controls (zoom, pan)</li>
          <li>Responsive design</li>
        </ul>
      </div>
    </div>
  );
};
