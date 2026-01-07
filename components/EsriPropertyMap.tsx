'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * ArcGIS Map Component
 * Displays an interactive map with Esri basemap and parcel data
 */

export interface EsriMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  showParcelBoundary?: boolean;
  height?: string;
}

// Dynamic import to avoid SSR issues
const ArcGISMap = React.lazy(() => import('./ArcGISMapCore'));

export function EsriPropertyMap({
  latitude,
  longitude,
  zoom = 18,
  showParcelBoundary = true,
  height = 'h-96',
}: EsriMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className={`${height} bg-slate-700 rounded-lg animate-pulse`} />;
  }

  return (
    <React.Suspense
      fallback={<div className={`${height} bg-slate-700 rounded-lg animate-pulse`} />}
    >
      <ArcGISMap
        latitude={latitude}
        longitude={longitude}
        zoom={zoom}
        showParcelBoundary={showParcelBoundary}
        height={height}
      />
    </React.Suspense>
  );
}
