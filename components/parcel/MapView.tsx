"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

// Simple interactive map stub component.
// This demonstrates the map click interaction without requiring external map libraries.
// Replace with a real map library (Leaflet, Mapbox, etc.) when ready.
type MapViewProps = {
  height?: number;
  onMapClick?: (lat: number, lng: number) => void;
};

function MapView({ height = 240, onMapClick }: MapViewProps) {
  const [clickPosition, setClickPosition] = React.useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setClickPosition({ x, y });

    // Convert click position to approximate lat/lng
    // This is a stub - real implementation would use proper map projection
    const lng = -122.0 + (x / rect.width) * 10; // Approximate range around SF Bay Area
    const lat = 37.0 + (1 - y / rect.height) * 5;
    
    if (onMapClick) {
      onMapClick(lat, lng);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div
        onClick={handleClick}
        style={{ height }}
        className="relative w-full cursor-crosshair bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950"
      >
        {/* Decorative grid to simulate map appearance */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Center instruction */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-background/80 px-4 py-2 text-center text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
            <MapPin className="mx-auto mb-1 h-5 w-5" />
            <p className="font-medium">Click anywhere to search for parcels</p>
            <p className="text-xs">Stub map - replace with real map library</p>
          </div>
        </div>

        {/* Click marker */}
        {clickPosition && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: clickPosition.x, top: clickPosition.y }}
          >
            <MapPin className="h-6 w-6 text-primary drop-shadow-lg" />
          </div>
        )}
      </div>
    </Card>
  );
}

export { MapView };
