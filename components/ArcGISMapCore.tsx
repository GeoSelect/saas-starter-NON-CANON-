'use client';

import { useEffect, useRef } from 'react';

/**
 * Core ArcGIS Map Implementation
 * Requires @arcgis/core to be installed
 */

interface ArcGISMapCoreProps {
  latitude: number;
  longitude: number;
  zoom: number;
  showParcelBoundary: boolean;
  height: string;
}

export default function ArcGISMapCore({
  latitude,
  longitude,
  zoom,
  showParcelBoundary,
  height,
}: ArcGISMapCoreProps) {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    const initMap = async () => {
      try {
        const esri = await import('@arcgis/core');
        const { Map, MapView, BasemapToggle } = esri;

        if (!mapContainer.current) return;

        // Create the map
        const map = new Map({
          basemap: 'streets-vector',
        });

        // Create the view
        const view = new MapView({
          container: mapContainer.current,
          map: map,
          center: [longitude, latitude],
          zoom: zoom,
          ui: {
            components: ['zoom', 'compass'],
          },
        });

        // Add basemap toggle
        const toggle = new BasemapToggle({
          view: view,
          nextBasemap: 'satellite',
        });

        view.ui.add(toggle, 'top-right');

        return () => {
          view.destroy();
        };
      } catch (error) {
        console.warn(
          'ArcGIS Core not installed. Install with: npm install @arcgis/core',
          error
        );

        // Fallback: show message
        if (mapContainer.current) {
          mapContainer.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #334155; color: #e2e8f0; font-family: sans-serif;">
              <div style="text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px;">Install ArcGIS Core to enable Esri mapping</p>
                <code style="background: #1e293b; padding: 8px 12px; border-radius: 4px; font-size: 12px;">pnpm add @arcgis/core</code>
              </div>
            </div>
          `;
        }
      }
    };

    initMap();
  }, [latitude, longitude, zoom, showParcelBoundary]);

  return (
    <div
      ref={mapContainer}
      className={`${height} rounded-lg shadow-lg overflow-hidden bg-slate-700`}
      style={{ width: '100%' }}
    />
  );
}
