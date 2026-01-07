'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { ParcelData, RiskOverlay } from '@/lib/services/parcel-service';

type InteractiveMapProps = {
  parcel: ParcelData;
  risks?: RiskOverlay[];
  showBoundaries?: boolean;
  showRisks?: boolean;
  height?: number;
};

export function InteractiveMap({
  parcel,
  risks = [],
  showBoundaries = true,
  showRisks = true,
  height = 400,
}: InteractiveMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [activeLayer, setActiveLayer] = React.useState<'streets' | 'satellite' | 'topo'>(
    'streets'
  );

  React.useEffect(() => {
    if (!mapRef.current) return;

    // 🎯 TODO: Initialize ESRI map
    // Using ArcGIS Maps SDK for JavaScript (optional install)
    // OR use Leaflet with ESRI basemaps (lightweight)

    const initMap = async () => {
      try {
        // Placeholder for map initialization
        // Once @arcgis/core is installed, this would look like:

        /*
        const [Map, MapView, GraphicsLayer, Graphic] = await Promise.all([
          import("@arcgis/core/Map"),
          import("@arcgis/core/views/MapView"),
          import("@arcgis/core/layers/GraphicsLayer"),
          import("@arcgis/core/Graphic"),
        ]);

        const map = new Map.default({
          basemap: activeLayer === 'satellite' ? 'satellite' : 'streets-vector',
        });

        const view = new MapView.default({
          container: mapRef.current,
          map: map,
          center: [parcel.coordinates.lng, parcel.coordinates.lat],
          zoom: 18,
        });

        // Add parcel boundary
        if (showBoundaries && parcel.geometry) {
          const graphicsLayer = new GraphicsLayer.default();
          map.add(graphicsLayer);

          const polygon = {
            type: "polygon",
            rings: parcel.geometry.coordinates[0],
          };

          const fillSymbol = {
            type: "simple-fill",
            color: [255, 165, 0, 0.3],
            outline: {
              color: [255, 100, 0],
              width: 2,
            },
          };

          const polygonGraphic = new Graphic.default({
            geometry: polygon,
            symbol: fillSymbol,
          });

          graphicsLayer.add(polygonGraphic);
        }

        // Add risk overlays
        if (showRisks && risks.length > 0) {
          // Add risk overlay layers
        }

        setMapLoaded(true);
        */

        // Temporary: Show placeholder
        setMapLoaded(true);
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };

    initMap();
  }, [parcel, activeLayer, showBoundaries, showRisks, risks]);

  return (
    <Card className="overflow-hidden">
      <div className="relative" style={{ height }}>
        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-full bg-gray-100"
          style={{ minHeight: height }}
        >
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center space-y-3 p-6">
                <Layers className="h-16 w-16 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold">Interactive Map Placeholder</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Install @arcgis/core to enable full mapping: <br />
                  <code className="bg-gray-200 px-2 py-1 rounded mt-2 inline-block">
                    pnpm add @arcgis/core
                  </code>
                </p>
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    {parcel.coordinates.lat.toFixed(6)}, {parcel.coordinates.lng.toFixed(6)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <div className="flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Layer Selector */}
        <div className="absolute bottom-4 left-4">
          <div className="flex gap-2 bg-white rounded-lg shadow-lg p-2">
            <Button
              size="sm"
              variant={activeLayer === 'streets' ? 'default' : 'outline'}
              onClick={() => setActiveLayer('streets')}
              className="text-xs"
            >
              Streets
            </Button>
            <Button
              size="sm"
              variant={activeLayer === 'satellite' ? 'default' : 'outline'}
              onClick={() => setActiveLayer('satellite')}
              className="text-xs"
            >
              Satellite
            </Button>
            <Button
              size="sm"
              variant={activeLayer === 'topo' ? 'default' : 'outline'}
              onClick={() => setActiveLayer('topo')}
              className="text-xs"
            >
              Topo
            </Button>
          </div>
        </div>

        {/* Risk Overlay Legend */}
        {showRisks && risks.length > 0 && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <p className="text-xs font-semibold mb-2">Risk Overlays</p>
            <div className="space-y-1">
              {risks.map((risk, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      risk.severity === 'high'
                        ? 'bg-red-500'
                        : risk.severity === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                  />
                  <span className="capitalize">{risk.type}</span>
                  <Badge variant="outline" className="text-xs">
                    {risk.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
