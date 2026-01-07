# Address Lookup & Map Functions Guide

## Overview

This guide covers the address lookup and map functions available on the Telluride real estate platform. These include geocoding, reverse geocoding, spatial calculations, and interactive map utilities.

## Address Lookup Components

### 1. AddressSearch Component

**Location:** `components/AddressSearch.tsx`

The primary component for searching properties by address.

#### Usage

```typescript
import { AddressSearch } from '@/components/AddressSearch';

export default function MyPage() {
  const handleParcelSelect = (parcel) => {
    console.log('Selected parcel:', parcel);
    // Navigate or update parent component
  };

  return (
    <AddressSearch 
      onParcelSelect={handleParcelSelect}
      placeholder="Enter an address..."
      showResults={true}
    />
  );
}
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onParcelSelect` | `(parcel: ParcelData) => void` | Yes | - | Callback when user selects a parcel |
| `placeholder` | `string` | No | "Search for a property..." | Input field placeholder text |
| `showResults` | `boolean` | No | `true` | Show/hide search results display |

#### Features

- **Geocoding Integration:** Converts addresses to coordinates using Esri geocoding API
- **Parcel Lookup:** Fetches parcel data from coordinates
- **Result Display:** Shows address, coordinates, APN, zoning, acreage, value
- **Error Handling:** Displays user-friendly errors
- **Loading States:** Visual feedback during search
- **Keyboard Support:** Enter key to search

### 2. Property Search Page

**Location:** `app/property-search/page.tsx`

Full-page interface for comprehensive property searching.

#### Features

- Address search with tips sidebar
- Property header card with quick stats
- Interactive map visualization
- Risk assessment display
- Property details grid
- Direct navigation to full report

#### How to Access

```
/property-search
```

#### Integration

Add link in your navigation:

```typescript
<Link href="/property-search">Find Property</Link>
```

## Esri Client Functions

**Location:** `lib/esri/client.ts`

Core API integration layer for Esri services.

### geocodeAddress()

Converts an address to latitude/longitude coordinates.

```typescript
import { geocodeAddress } from '@/lib/esri/client';

const result = await geocodeAddress('123 Main St, Boulder, CO');
// Returns: { location: { x: -105.2705, y: 40.0150 }, confidence: 'high', ... }
```

### reverseGeocode()

Converts coordinates back to an address.

```typescript
import { reverseGeocode } from '@/lib/esri/client';

const address = await reverseGeocode(40.0150, -105.2705);
// Returns: '123 Main Street, Boulder, Colorado, 80301'
```

### getParcelData()

Queries parcel information at specific coordinates.

```typescript
import { getParcelData } from '@/lib/esri/client';

const parcel = await getParcelData(40.0150, -105.2705);
// Returns: { apn: '123-45-678', owner: '...', zoning: '...', ... }
```

### getPropertyDemographics()

Fetches demographic enrichment data for a location.

```typescript
import { getPropertyDemographics } from '@/lib/esri/client';

const demographics = await getPropertyDemographics(40.0150, -105.2705);
// Returns: { population: 5000, medianAge: 35, income: 75000, ... }
```

## Parcel Service

**Location:** `lib/services/parcel-service.ts`

Business logic layer built on top of Esri client.

```typescript
import { parcelService } from '@/lib/services/parcel-service';
```

### searchByAddress()

High-level search combining geocoding and parcel lookup.

```typescript
const results = await parcelService.searchByAddress('123 Main St, Boulder, CO');
// Returns: ParcelData[]
```

### getParcelByCoordinates()

Lookup parcel at specific lat/lng.

```typescript
const parcel = await parcelService.getParcelByCoordinates(40.0150, -105.2705);
// Returns: ParcelData
```

### getParcelByAPN()

Lookup parcel by Assessor Parcel Number.

```typescript
const parcel = await parcelService.getParcelByAPN('123-45-678');
// Returns: ParcelData
```

### getRiskOverlays()

Get risk assessment data for a parcel.

```typescript
const risks = await parcelService.getRiskOverlays(parcel);
// Returns: RiskOverlay[]
// Types: flood, fire, earthquake, environmental
```

### getNearbyParcels()

Find properties within a radius.

```typescript
const nearby = await parcelService.getNearbyParcels(
  40.0150,  // latitude
  -105.2705, // longitude
  1          // radius in miles
);
// Returns: ParcelData[]
```

## Map Utilities

**Location:** `lib/esri/map-utils.ts`

Helper functions for map operations and spatial calculations.

### Distance Calculation

Calculate distance between two points:

```typescript
import { calculateDistance } from '@/lib/esri/map-utils';

const miles = calculateDistance(
  { latitude: 40.0150, longitude: -105.2705 },
  { latitude: 40.0200, longitude: -105.2750 }
);
// Returns: 0.45 (miles)
```

### Bounding Box Operations

Create a bounding box from center point and radius:

```typescript
import { createBoundingBox } from '@/lib/esri/map-utils';

const bbox = createBoundingBox(
  { latitude: 40.0150, longitude: -105.2705 },
  2 // radius in miles
);
// Returns: { xmin, ymin, xmax, ymax, spatialReference }
```

### Zoom Level Calculation

Auto-calculate appropriate zoom for a bounding box:

```typescript
import { calculateZoomLevel } from '@/lib/esri/map-utils';

const zoom = calculateZoomLevel(boundingBox);
// Returns: 15 (0-20)
```

### Coordinate Formatting

Format coordinates for display:

```typescript
import { formatCoordinates } from '@/lib/esri/map-utils';

// Decimal format (default)
const decimal = formatCoordinates(40.0150, -105.2705);
// Returns: '40.015000, -105.270500'

// Degrees/Minutes/Seconds format
const dms = formatCoordinates(40.0150, -105.2705, 'dms');
// Returns: '40° 0\' 54.00" N, 105° 16\' 14.00" W'
```

### Coordinate Conversion

Convert between Web Mercator and WGS84 coordinate systems:

```typescript
import { webMercatorToWgs84, wgs84ToWebMercator } from '@/lib/esri/map-utils';

const wgs84 = webMercatorToWgs84(mercatorX, mercatorY);
const mercator = wgs84ToWebMercator(40.0150, -105.2705);
```

### Geometry Creation

Create geometries for drawing on maps:

```typescript
import { createCircleGeometry, createRectangleGeometry } from '@/lib/esri/map-utils';

// Create circle around a point
const circle = createCircleGeometry(
  { latitude: 40.0150, longitude: -105.2705 },
  1 // radius in miles
);

// Create rectangle from bounding box
const rectangle = createRectangleGeometry(boundingBox);
```

## Interactive Map Component

**Location:** `components/parcel/InteractiveMap.tsx`

Ready-to-use map visualization component.

### Basic Usage

```typescript
import { InteractiveMap } from '@/components/parcel/InteractiveMap';

export default function MyMap() {
  return (
    <InteractiveMap
      parcel={parcelData}
      risks={riskOverlays}
      showBoundaries={true}
      showRisks={true}
      height={500}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `parcel` | `ParcelData` | Required | Property data to display |
| `risks` | `RiskOverlay[]` | `[]` | Risk data to overlay |
| `showBoundaries` | `boolean` | `true` | Show parcel boundary polygon |
| `showRisks` | `boolean` | `true` | Show risk overlays |
| `height` | `number` | `400` | Map height in pixels |

### Features

- Parcel boundary visualization
- Risk overlay display with color coding
- Zoom in/out controls
- Fullscreen mode
- Basemap toggle (Streets/Satellite/Topographic)
- Risk legend
- Loading states
- Responsive design

## Common Use Cases

### 1. Search for Property and Show Details

```typescript
'use client';
import { useState } from 'react';
import { AddressSearch } from '@/components/AddressSearch';
import { InteractiveMap } from '@/components/parcel/InteractiveMap';
import { parcelService } from '@/lib/services/parcel-service';

export default function PropertyView() {
  const [parcel, setParcel] = useState(null);
  const [risks, setRisks] = useState([]);

  const handleSelect = async (selectedParcel) => {
    setParcel(selectedParcel);
    const riskData = await parcelService.getRiskOverlays(selectedParcel);
    setRisks(riskData);
  };

  return (
    <div className="flex gap-4">
      <div className="w-1/3">
        <AddressSearch onParcelSelect={handleSelect} />
      </div>
      <div className="w-2/3">
        {parcel && (
          <>
            <h2>{parcel.address}</h2>
            <InteractiveMap parcel={parcel} risks={risks} />
          </>
        )}
      </div>
    </div>
  );
}
```

### 2. Find Nearby Properties

```typescript
const center = { latitude: 40.0150, longitude: -105.2705 };
const nearby = await parcelService.getNearbyParcels(
  center.latitude,
  center.longitude,
  2 // 2-mile radius
);

// Display on map
import { createBoundingBox, calculateZoomLevel } from '@/lib/esri/map-utils';

const bbox = createBoundingBox(center, 2);
const zoom = calculateZoomLevel(bbox);
// Use bbox and zoom for map extent
```

### 3. Batch Geocoding

```typescript
import { geocodeAddress } from '@/lib/esri/client';

const addresses = ['123 Main St, Boulder, CO', '456 Oak Ave, Boulder, CO'];
const results = await Promise.all(
  addresses.map(addr => geocodeAddress(addr))
);

// results contains all geocoded coordinates
```

### 4. Distance-Based Search

```typescript
import { calculateDistance } from '@/lib/esri/map-utils';

const userLocation = { latitude: 40.0150, longitude: -105.2705 };
const properties = await getPropertiesInRadius(userLocation, 2);

// Filter by distance
const filtered = properties.filter(prop => {
  const distance = calculateDistance(userLocation, {
    latitude: prop.coordinates.latitude,
    longitude: prop.coordinates.longitude
  });
  return distance <= 2; // 2 miles
});
```

## Error Handling

All map and search functions include error handling:

```typescript
try {
  const parcel = await parcelService.searchByAddress(address);
} catch (error) {
  console.error('Address lookup failed:', error);
  // Show user-friendly error message
}
```

Common errors:
- `"Address not found"` - Esri geocoding couldn't locate address
- `"No parcel data found"` - Address exists but no parcel records
- `"Network error"` - API request failed
- `"Invalid coordinates"` - Coordinates outside service area

## Performance Tips

1. **Debounce Search**: For real-time search, debounce requests
   ```typescript
   const debouncedSearch = debounce((addr) => {
     parcelService.searchByAddress(addr);
   }, 300);
   ```

2. **Cache Results**: Store recently viewed parcels
   ```typescript
   const cache = new Map();
   ```

3. **Lazy Load Map**: Only initialize Esri map when visible
   ```typescript
   <InteractiveMap {...props} /> // Lazy loads @arcgis/core
   ```

4. **Limit Search Radius**: Narrow radius = faster results
   ```typescript
   // Instead of 10 miles, use 2 miles
   const nearby = await getNearbyParcels(lat, lng, 2);
   ```

## Troubleshooting

### Address Not Found
- Verify complete address (street, city, state, ZIP)
- Try without ZIP code
- Check for typos

### Map Not Displaying
- Confirm `@arcgis/core` installed: `pnpm add @arcgis/core`
- Check browser console for errors
- Verify Esri API key in `.env.local`

### Slow Performance
- Reduce search radius
- Cache frequently accessed properties
- Use pagination for large result sets

### Coordinates Out of Range
- Ensure latitude is -90 to 90
- Ensure longitude is -180 to 180
- Service area: USA only currently

## API Limits

Esri API rate limits (free tier):
- **Geocoding**: 40,000 requests/month
- **Feature Service Queries**: 100,000 requests/month
- **Batch Operations**: 10 concurrent requests

Monitor usage and consider upgrade if approaching limits.

## Next Steps

1. **Integrate into Landing Page**: Add "Find Property" button linking to `/property-search`
2. **Mobile Optimization**: Ensure AddressSearch responsive on mobile
3. **Search History**: Store recent searches in localStorage
4. **Saved Properties**: Allow users to bookmark/save properties
5. **Comparison Tool**: Compare multiple properties side-by-side
6. **Market Analysis**: Add comparable properties to detail page

## Additional Resources

- [Esri REST API Documentation](https://developers.arcgis.com/rest/services-reference/)
- [ArcGIS Core SDK Docs](https://developers.arcgis.com/javascript/latest/)
- [Geocoding API Guide](https://developers.arcgis.com/rest/geocode/api-reference/)
- [Feature Service Query](https://developers.arcgis.com/rest/services-reference/enterprise/feature-service/)
