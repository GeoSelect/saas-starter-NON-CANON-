'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ParcelData } from '@/lib/services/parcel-service';
import { COMMON_BOUNDS } from '@/lib/esri/map-utils';

interface SearchMapProps {
  selectedParcel?: ParcelData | null;
  nearbyParcels?: ParcelData[];
  height?: number;
}

export function SearchMap({
  selectedParcel,
  nearbyParcels = [],
  height = 500,
}: SearchMapProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Log when properties change
  useEffect(() => {
    if (selectedParcel) {
      console.log('Selected Parcel on map:', selectedParcel);
    }
    if (nearbyParcels.length > 0) {
      console.log('Nearby Parcels on map:', nearbyParcels.length);
    }
  }, [selectedParcel, nearbyParcels]);

  return (
    <Card className="overflow-hidden bg-white">
      <div
        style={{ height: `${height}px`, width: '100%' }}
        className="relative bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 flex flex-col items-center justify-center"
      >
        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <p className="text-sm text-slate-600">Loading Telluride map...</p>
          </div>
        ) : (
          <div className="w-full h-full relative flex flex-col items-center justify-center">
            {/* Map Visualization */}
            <svg
              width="100%"
              height="100%"
              className="absolute inset-0"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Grid pattern background */}
              <defs>
                <pattern
                  id="grid"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" opacity="0.3" />

              {/* Telluride marker (center) */}
              <circle cx="50" cy="50" r="2" fill="#f97316" />
              <circle cx="50" cy="50" r="3" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.5" />

              {/* Nearby property markers */}
              {nearbyParcels.slice(0, 5).map((_, idx) => {
                // Scatter nearby properties around the center
                const angle = (idx / nearbyParcels.length) * Math.PI * 2;
                const distance = 15;
                const x = 50 + Math.cos(angle) * distance;
                const y = 50 + Math.sin(angle) * distance;

                return (
                  <g key={`nearby-${idx}`}>
                    <circle cx={x} cy={y} r="1.5" fill="#3b82f6" />
                    <circle
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="0.5"
                      opacity="0.5"
                    />
                  </g>
                );
              })}

              {/* Selected property marker */}
              {selectedParcel && (
                <g>
                  <circle cx="50" cy="50" r="3" fill="#f97316" />
                  <circle
                    cx="50"
                    cy="50"
                    r="5"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                </g>
              )}
            </svg>

            {/* Info Overlay - Top Left */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-sm text-xs z-10">
              <div className="font-semibold text-slate-900 mb-1">📍 Telluride Base Map</div>
              <div className="text-slate-600 text-xs">Elevation: 8,750 ft</div>
              <div className="text-slate-600 text-xs">37.945° N, 107.815° W</div>
            </div>

            {/* Map Controls - Top Right */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
              <button className="w-8 h-8 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center justify-center text-sm font-semibold text-slate-700 shadow-sm">
                +
              </button>
              <button className="w-8 h-8 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center justify-center text-sm font-semibold text-slate-700 shadow-sm">
                −
              </button>
              <button className="w-8 h-8 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-700 shadow-sm">
                ⛶
              </button>
            </div>

            {/* Legend - Bottom Left */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-sm text-xs z-10">
              <div className="font-semibold text-slate-900 mb-2">Map Legend</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Selected Property</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Nearby Properties</span>
                </div>
              </div>
            </div>

            {/* Property Count - Bottom Right */}
            {nearbyParcels.length > 0 && (
              <div className="absolute bottom-3 right-3 bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg shadow-sm text-xs z-10">
                <div className="text-orange-900 font-medium">
                  {nearbyParcels.length} nearby properties
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Footer Info */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>
            {selectedParcel
              ? `📍 ${selectedParcel.address}`
              : '🗺️ Telluride Base Map - Search to add properties'}
          </span>
          {nearbyParcels.length > 0 && (
            <span className="text-orange-600 font-medium">
              {nearbyParcels.length} properties nearby
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
