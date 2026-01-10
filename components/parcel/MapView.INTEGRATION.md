# MapView Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the MapView component into your application pages.

## Quick Start

### 1. Basic Integration

The simplest way to use MapView:

```tsx
// app/my-page/page.tsx
"use client";

import { MapView } from "@/components/parcel/MapView";

export default function MyPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Property Map</h1>
      <MapView height={500} />
    </div>
  );
}
```

### 2. With Parcel Boundary

Display a specific parcel:

```tsx
"use client";

import { MapView, ParcelBoundary } from "@/components/parcel/MapView";

export default function ParcelPage() {
  const parcelData: ParcelBoundary = {
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
      apn: "123-456-789",
      owner: "John Doe",
      address: "123 Main St, Telluride, CO",
    },
  };

  return (
    <div className="container mx-auto p-4">
      <MapView 
        height={600}
        parcelBoundary={parcelData}
        parcelCenter={{ lat: 37.9375, lng: -107.8135 }}
      />
    </div>
  );
}
```

### 3. Interactive Map with Click Handler

Handle user interactions:

```tsx
"use client";

import { MapView } from "@/components/parcel/MapView";
import { useState } from "react";

export default function InteractivePage() {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    // Fetch parcel data, perform analysis, etc.
    console.log(`Selected: ${lat}, ${lng}`);
  };

  return (
    <div className="container mx-auto p-4">
      <MapView 
        height={500}
        onMapClick={handleMapClick}
      />
      {selectedLocation && (
        <div className="mt-4 p-4 border rounded">
          <p>Selected Location:</p>
          <p>Lat: {selectedLocation.lat.toFixed(6)}</p>
          <p>Lng: {selectedLocation.lng.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
}
```

## Advanced Integration

### Dynamic Parcel Loading

Load parcel data from an API:

```tsx
"use client";

import { MapView, ParcelBoundary } from "@/components/parcel/MapView";
import { useEffect, useState } from "react";

export default function DynamicParcelPage({ 
  params 
}: { 
  params: { parcelId: string } 
}) {
  const [parcel, setParcel] = useState<ParcelBoundary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParcel() {
      try {
        const response = await fetch(`/api/parcels/${params.parcelId}`);
        const data = await response.json();
        setParcel(data.boundary);
      } catch (error) {
        console.error("Failed to load parcel:", error);
      } finally {
        setLoading(false);
      }
    }
    loadParcel();
  }, [params.parcelId]);

  if (loading) {
    return <div>Loading parcel data...</div>;
  }

  return (
    <MapView 
      height={600}
      parcelBoundary={parcel}
    />
  );
}
```

### Multiple Parcels with Data Layers

Display multiple parcels using GeoJSON layers:

```tsx
"use client";

import { MapView } from "@/components/parcel/MapView";
import { Source, Layer } from "react-map-gl/maplibre";

export default function MultiParcelPage() {
  const parcelsGeoJSON = {
    type: "FeatureCollection",
    features: [
      {
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
        properties: { id: 1, value: 250000 },
      },
      // Add more parcels...
    ],
  };

  // Note: For displaying custom layers, you may need to extend MapView
  // or use the Map component directly with custom Source/Layer components

  return (
    <MapView 
      height={600}
      initialZoom={15}
    />
  );
}
```

### Full-Screen Map

Create a full-screen map experience:

```tsx
"use client";

import { MapView } from "@/components/parcel/MapView";
import { useState, useEffect } from "react";

export default function FullScreenMapPage() {
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const updateHeight = () => {
      setHeight(window.innerHeight - 80); // Account for header
    };
    
    updateHeight();
    window.addEventListener("resize", updateHeight);
    
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div className="w-full">
      <MapView 
        height={height}
        initialZoom={12}
        className="w-full"
      />
    </div>
  );
}
```

### Custom Basemaps

Use your own basemap styles:

```tsx
"use client";

import { MapView, BasemapOption } from "@/components/parcel/MapView";

export default function CustomBasemapPage() {
  const customBasemaps: BasemapOption[] = [
    { 
      label: "Satellite", 
      value: "https://tiles.openfreemap.org/styles/satellite" 
    },
    { 
      label: "Terrain", 
      value: "https://tiles.openfreemap.org/styles/terrain" 
    },
    { 
      label: "Custom", 
      value: "/styles/custom-style.json" // Your own style
    },
  ];

  return (
    <MapView 
      height={500}
      basemapOptions={customBasemaps}
    />
  );
}
```

## Environment Setup

### Required Environment Variables

Add to your `.env.local`:

```bash
# Required for reverse geocoding and Street View
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

Get your Google Maps API key:
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Geocoding API" and "Maps Embed API"
4. Create credentials (API Key)
5. Restrict key to your domain for production

### Optional: Custom MapLibre Styles

If you're hosting your own map styles:

```bash
# Optional: Custom tile server
NEXT_PUBLIC_MAP_TILE_URL=https://your-tile-server.com
```

## Server-Side Integration

### API Route for Parcel Data

```typescript
// app/api/parcels/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getParcelById } from "@/lib/services/parcel-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parcel = await getParcelById(params.id);
    
    if (!parcel) {
      return NextResponse.json(
        { error: "Parcel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      boundary: {
        type: "Feature",
        geometry: parcel.geometry,
        properties: {
          apn: parcel.apn,
          owner: parcel.owner,
          address: parcel.address,
        },
      },
      center: {
        lat: parcel.lat,
        lng: parcel.lng,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Common Integration Patterns

### 1. Dashboard Widget

Small map preview in a dashboard:

```tsx
import { MapView } from "@/components/parcel/MapView";

export function MapWidget() {
  return (
    <div className="rounded-lg overflow-hidden shadow-lg">
      <MapView 
        height={300}
        showBasemapSelector={false}
        showTerrainControls={false}
        enableStreetView={false}
      />
    </div>
  );
}
```

### 2. Modal/Dialog Map

Map inside a dialog:

```tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapView } from "@/components/parcel/MapView";

export function MapDialog({ 
  open, 
  onOpenChange, 
  parcel 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: any;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <MapView 
          height={500}
          parcelBoundary={parcel.boundary}
          parcelCenter={parcel.center}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Search Results Map

Show search results on a map:

```tsx
import { MapView, ParcelBoundary } from "@/components/parcel/MapView";

export function SearchResultsMap({ results }: { results: any[] }) {
  const [selectedResult, setSelectedResult] = useState<any>(null);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => setSelectedResult(result)}
            className="w-full p-4 border rounded hover:bg-gray-50"
          >
            {result.address}
          </button>
        ))}
      </div>
      <div>
        <MapView 
          height={600}
          parcelBoundary={selectedResult?.boundary}
          parcelCenter={selectedResult?.center}
        />
      </div>
    </div>
  );
}
```

## Performance Optimization

### Lazy Loading

Only load the map when needed:

```tsx
import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/parcel/MapView").then((mod) => mod.MapView),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px]">
        <p>Loading map...</p>
      </div>
    ),
  }
);

export default function MyPage() {
  return <MapView height={500} />;
}
```

### Conditional Rendering

Only render map when tab is active:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapView } from "@/components/parcel/MapView";

export default function TabbedPage() {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="map">Map</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        {/* Details content */}
      </TabsContent>
      <TabsContent value="map">
        <MapView height={500} />
      </TabsContent>
    </Tabs>
  );
}
```

## Troubleshooting

### Map Not Displaying

**Issue**: Blank white area where map should be

**Solutions**:
1. Check that MapLibre CSS is imported
2. Verify container has explicit height
3. Check browser console for errors
4. Ensure basemap URL is accessible

### Build Errors

**Issue**: TypeScript compilation errors

**Solutions**:
1. Ensure all dependencies are installed: `pnpm install`
2. Check TypeScript version compatibility
3. Verify import paths are correct
4. Clear Next.js cache: `rm -rf .next`

### Performance Issues

**Issue**: Slow rendering or laggy interactions

**Solutions**:
1. Use lazy loading for map-heavy pages
2. Reduce initial zoom level
3. Limit number of features rendered
4. Use GeoJSON clustering for large datasets
5. Consider using simpler basemap styles

## Testing

### Component Testing

```typescript
import { describe, it, expect } from "vitest";
import type { ParcelBoundary } from "@/components/parcel/MapView";

describe("MapView Integration", () => {
  it("should render with parcel boundary", () => {
    const boundary: ParcelBoundary = {
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
      properties: {},
    };

    expect(boundary.type).toBe("Feature");
  });
});
```

### E2E Testing with Playwright

```typescript
import { test, expect } from "@playwright/test";

test("map loads and displays", async ({ page }) => {
  await page.goto("/map");
  
  // Wait for map to load
  await page.waitForSelector(".maplibregl-canvas");
  
  // Verify navigation controls are present
  const navControls = page.locator(".maplibregl-ctrl-group");
  await expect(navControls).toBeVisible();
});
```

## Migration from Other Map Libraries

### From Google Maps

```tsx
// Before (Google Maps)
<GoogleMap center={{ lat: 37.9375, lng: -107.8123 }} zoom={14} />

// After (MapView)
<MapView 
  initialCenter={{ lat: 37.9375, lng: -107.8123 }}
  initialZoom={14}
/>
```

### From Leaflet

```tsx
// Before (Leaflet)
<MapContainer center={[37.9375, -107.8123]} zoom={14} />

// After (MapView)
<MapView 
  initialCenter={{ lat: 37.9375, lng: -107.8123 }}
  initialZoom={14}
/>
```

## Best Practices

1. **Always set explicit height** - Maps need a defined container height
2. **Use lazy loading** - Reduce initial bundle size for better performance
3. **Handle errors gracefully** - Show fallback UI when map fails to load
4. **Optimize for mobile** - Test responsive behavior on small screens
5. **Clean up resources** - MapView handles cleanup automatically
6. **Secure API keys** - Never expose API keys in client code
7. **Use environment variables** - Keep configuration separate from code
8. **Test on different browsers** - Ensure WebGL compatibility

## Support

For issues or questions:
- Check the [MapView README](./MapView.README.md)
- Review [Ladle stories](http://localhost:61000) for examples
- Open a GitHub issue with reproduction steps
- Consult MapLibre GL JS docs: https://maplibre.org/

## Next Steps

- Explore advanced MapLibre features (heatmaps, 3D terrain)
- Add custom markers and popups
- Implement data-driven styling
- Add drawing tools for user interaction
- Integrate with backend GIS services
