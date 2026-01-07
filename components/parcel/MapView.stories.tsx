"use client";

import { MapView } from "./MapView";

export const Default = () => (
  <div className="max-w-3xl">
    <MapView />
  </div>
);

export const WithClickHandler = () => (
  <div className="max-w-3xl space-y-4">
    <MapView 
      onMapClick={(lat, lng) => {
        alert(`Clicked at: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }} 
    />
    <p className="text-sm text-muted-foreground">
      Click anywhere on the map to trigger the callback
    </p>
  </div>
);

export const CustomHeight = () => (
  <div className="max-w-3xl">
    <MapView height={400} />
  </div>
);
