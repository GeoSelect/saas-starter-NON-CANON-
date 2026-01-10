# MapView Component Documentation

## Overview

The `MapView` component is a comprehensive, production-ready interactive map component built with **MapLibre GL JS** and **react-map-gl**. It provides a rich set of features for displaying geographic data, parcel boundaries, and interactive mapping experiences.

## Features

✅ **Multiple Basemap Styles** - Choose from Light, Dark, Streets, 3D Buildings, and Topography  
✅ **Interactive Controls** - Zoom, pan, tilt, and rotate the map  
✅ **Parcel Boundary Visualization** - Display GeoJSON polygon overlays  
✅ **Click Interactions** - Handle map clicks with reverse geocoding  
✅ **Street View Integration** - Optional Google Street View integration  
✅ **3D Terrain Support** - Pitch and bearing controls for 3D visualization  
✅ **Responsive Design** - Works seamlessly on desktop, tablet, and mobile  
✅ **Error Handling** - Comprehensive error handling with user-friendly messages  
✅ **Loading States** - Visual feedback during map initialization and geocoding  
✅ **TypeScript Support** - Fully typed with comprehensive type definitions  
✅ **Accessibility** - ARIA labels and keyboard navigation support  
✅ **Performance Optimized** - Map instance reuse and proper cleanup on unmount

## Installation

The required dependencies are already included in the project:

```json
{
  "dependencies": {
    "maplibre-gl": "^5.15.0",
    "react-map-gl": "^8.1.0"
  }
}
```

## Basic Usage

```tsx
import { MapView } from "@/components/parcel/MapView";

export default function MyPage() {
  return (
    <MapView 
      height={400}
      initialCenter={{ lat: 37.9375, lng: -107.8123 }}
      initialZoom={14}
    />
  );
}
```

## Props

### MapViewProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | `number` | `240` | Height of the map container in pixels |
| `onMapClick` | `(lat: number, lng: number) => void` | `undefined` | Callback fired when the map is clicked |
| `parcelBoundary` | `ParcelBoundary \| null` | `undefined` | Optional parcel boundary to display as a polygon overlay |
| `parcelCenter` | `Coordinate \| null` | `undefined` | Optional center point to focus the map on |
| `initialCenter` | `Coordinate` | `{ lat: 37.9375, lng: -107.8123 }` | Initial map center (Telluride, CO) |
| `initialZoom` | `number` | `14` | Initial zoom level (0-22) |
| `basemapOptions` | `BasemapOption[]` | Default styles | Custom basemap options |
| `showBasemapSelector` | `boolean` | `true` | Show/hide the basemap selector control |
| `showTerrainControls` | `boolean` | `true` | Show/hide pitch and bearing controls |
| `enableStreetView` | `boolean` | `true` | Enable/disable street view integration |
| `className` | `string` | `""` | Custom class name for the card wrapper |

## Type Definitions

### ParcelBoundary

```typescript
type ParcelBoundary = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties?: Record<string, any>;
};
```

### Coordinate

```typescript
type Coordinate = {
  lat: number;
  lng: number;
};
```

### BasemapOption

```typescript
type BasemapOption = {
  label: string;
  value: string;
};
```

## Examples

### Display a Parcel Boundary

```tsx
import { MapView, ParcelBoundary } from "@/components/parcel/MapView";

export default function ParcelMap() {
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
    properties: {
      apn: "123-456-789",
      owner: "John Doe",
    },
  };

  return (
    <MapView 
      height={500}
      parcelBoundary={boundary}
    />
  );
}
```

### Handle Map Clicks

```tsx
import { MapView } from "@/components/parcel/MapView";

export default function InteractiveMap() {
  const handleMapClick = (lat: number, lng: number) => {
    console.log(`Clicked location: ${lat}, ${lng}`);
    // Perform additional actions (e.g., fetch parcel data)
  };

  return (
    <MapView 
      height={400}
      onMapClick={handleMapClick}
    />
  );
}
```

### Custom Basemap Styles

```tsx
import { MapView, BasemapOption } from "@/components/parcel/MapView";

export default function CustomMap() {
  const customBasemaps: BasemapOption[] = [
    { label: "OSM Bright", value: "https://tiles.openfreemap.org/styles/bright" },
    { label: "OSM Liberty", value: "https://tiles.openfreemap.org/styles/liberty" },
  ];

  return (
    <MapView 
      height={400}
      basemapOptions={customBasemaps}
    />
  );
}
```

### Minimal Interface

```tsx
import { MapView } from "@/components/parcel/MapView";

export default function MinimalMap() {
  return (
    <MapView 
      height={300}
      showBasemapSelector={false}
      showTerrainControls={false}
      enableStreetView={false}
    />
  );
}
```

### Responsive Full-Screen Map

```tsx
import { MapView } from "@/components/parcel/MapView";

export default function FullScreenMap() {
  return (
    <div className="h-screen w-screen">
      <MapView 
        height={window.innerHeight}
        className="h-full"
      />
    </div>
  );
}
```

## Environment Variables

The MapView component uses the following environment variables:

### NEXT_PUBLIC_GOOGLE_MAPS_KEY

Required for:
- Reverse geocoding (address lookup)
- Street View integration

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

Get your API key from: https://developers.google.com/maps/documentation/javascript/get-api-key

## Basemap Styles

The component comes with 5 default basemap styles:

1. **Light** - Clean, minimal style for data visualization
2. **Dark** - Dark theme for reduced eye strain
3. **Streets** - Standard street map with labels
4. **3D Buildings** - Includes 3D building extrusions
5. **Topography** - Shows terrain and elevation (default)

All basemaps are free to use and don't require API keys.

## 3D Terrain Controls

When using the Topography or 3D Buildings basemap styles, you can:

- **Tilt** - Adjust the pitch (0-60°) to view the map at an angle
- **Rotate** - Adjust the bearing (0-360°) to rotate the map

These controls enable immersive 3D visualization of terrain and buildings.

## Performance Considerations

### Bundle Size

- MapLibre GL JS: ~180KB gzipped
- react-map-gl: ~40KB gzipped
- Total: ~220KB gzipped

### Optimization Tips

1. **Lazy Loading**: Use dynamic imports for map-heavy pages
2. **Map Instance Reuse**: The component uses `reuseMaps` prop to reuse map instances
3. **Cleanup**: Proper cleanup on unmount prevents memory leaks
4. **Large Datasets**: For rendering many features, use GeoJSON sources with clustering

Example lazy loading:

```tsx
import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/parcel/MapView").then((mod) => mod.MapView),
  { 
    ssr: false,
    loading: () => <div>Loading map...</div>
  }
);
```

## Error Handling

The component handles several error scenarios:

1. **Map Load Failures** - Shows error banner with retry message
2. **Geocoding Failures** - Graceful fallback with error message
3. **Missing API Keys** - Warns in console and shows fallback UI
4. **Invalid Coordinates** - Validates and handles boundary calculation errors

Error messages are displayed in a non-intrusive banner at the top of the map.

## Accessibility

The component includes:

- ARIA labels on all interactive controls
- Keyboard navigation support via MapLibre GL JS
- Screen reader friendly error messages
- High contrast colors for boundaries and markers
- Semantic HTML structure

## Browser Support

The MapView component supports:

- Chrome/Edge 80+
- Firefox 78+
- Safari 13+
- Mobile Safari 13+
- Chrome Android 80+

MapLibre GL JS requires WebGL support.

## Troubleshooting

### Map Not Displaying

1. Check browser console for errors
2. Verify maplibre-gl CSS is imported
3. Ensure container has explicit height
4. Check for conflicting CSS (z-index, position)

### Basemap Not Loading

1. Check network tab for 404 errors
2. Verify basemap URL is valid and accessible
3. Try a different basemap style
4. Check for CORS issues

### Street View Not Working

1. Verify `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is set
2. Check API key has Street View API enabled
3. Ensure location has street view coverage
4. Check browser console for API errors

### Performance Issues

1. Reduce map height for better mobile performance
2. Use lazy loading for map-heavy pages
3. Limit the number of features rendered
4. Use GeoJSON clustering for large datasets

## Testing

The MapView component can be tested using the provided Ladle stories:

```bash
pnpm ladle serve
```

Navigate to `http://localhost:61000` and explore the MapView stories.

## Related Components

- `InteractiveMap.tsx` - Alternative map implementation
- `TopoMapView.tsx` - Topography-focused map view
- `ParcelDetailsSheet.tsx` - Property details panel (used with MapView)

## Architecture

The MapView component is built on:

- **MapLibre GL JS** - Open-source mapping library (Mapbox GL fork)
- **react-map-gl** - React wrapper for MapLibre/Mapbox GL JS
- **Radix UI** - Accessible UI components (Sheet, Card)
- **Tailwind CSS** - Utility-first CSS framework

## Contributing

When contributing to the MapView component:

1. Maintain TypeScript type safety
2. Add comprehensive JSDoc comments
3. Update stories for new features
4. Test on mobile devices
5. Follow existing code style
6. Update this documentation

## License

This component is part of the saas-starter project and follows the project's license.

## Support

For issues or questions:
1. Check this documentation
2. Review the component stories
3. Check the main project README
4. Open a GitHub issue

## Changelog

### v1.1.0 (January 2026)
- Enhanced TypeScript types
- Added comprehensive error handling
- Improved loading states
- Added responsive design support
- Enhanced accessibility
- Added performance optimizations
- Proper cleanup on unmount
- Comprehensive documentation

### v1.0.0
- Initial implementation
- Basic map display
- Parcel boundary support
- Street view integration
