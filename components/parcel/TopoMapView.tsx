'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, MapPin, Mountain } from 'lucide-react';

interface TopoMapViewProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  elevation?: number;
  height?: number;
}

export function TopoMapView({
  latitude = 37.945,
  longitude = -107.815,
  address = '123 Main Street, Telluride, CO',
  elevation = 8750,
  height = 400,
}: TopoMapViewProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="overflow-hidden bg-white">
      <div
        style={{ height: `${height}px`, width: '100%' }}
        className="relative bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
              <p className="text-sm text-slate-600">Loading 3D Topographic Map...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 3D Topo SVG Map */}
            <svg
              viewBox="0 0 1000 600"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Topo contour patterns */}
                <linearGradient id="topoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#7dd3c0', stopOpacity: 0.6 }} />
                  <stop offset="50%" style={{ stopColor: '#5a9f7a', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#2d5a4a', stopOpacity: 1 }} />
                </linearGradient>

                {/* Contour line pattern for elevation visualization */}
                <pattern
                  id="contourPattern"
                  x="0"
                  y="0"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 0 20 Q 10 15, 20 20 T 40 20"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="0.5"
                    opacity="0.4"
                  />
                  <path
                    d="M 0 30 Q 10 25, 20 30 T 40 30"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="0.5"
                    opacity="0.4"
                  />
                </pattern>
              </defs>

              {/* Mountain/Terrain background */}
              <rect width="1000" height="600" fill="url(#topoGradient)" />

              {/* Topographic contour lines */}
              <rect
                width="1000"
                height="600"
                fill="url(#contourPattern)"
                opacity="0.5"
              />

              {/* Elevation zones (darker = higher) */}
              <ellipse
                cx="500"
                cy="350"
                rx="250"
                ry="180"
                fill="#4a7c59"
                opacity="0.3"
              />
              <ellipse
                cx="500"
                cy="300"
                rx="180"
                ry="120"
                fill="#2d5a4a"
                opacity="0.4"
              />

              {/* Ridge lines simulation */}
              <path
                d="M 300 400 Q 500 150, 700 400"
                fill="none"
                stroke="#1e3a2f"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Valley lines */}
              <path
                d="M 250 450 Q 500 500, 750 450"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1"
                opacity="0.3"
                strokeDasharray="5,5"
              />

              {/* Property location marker (center) */}
              <g>
                {/* Elevation indicator circles */}
                <circle cx="500" cy="300" r="40" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.8" />
                <circle cx="500" cy="300" r="30" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.5" />

                {/* Center pin */}
                <circle cx="500" cy="300" r="8" fill="#f97316" />
                <circle cx="500" cy="300" r="12" fill="none" stroke="#fff" strokeWidth="2" />

                {/* 3D perspective indicator */}
                <path
                  d="M 495 305 L 505 305"
                  stroke="#f97316"
                  strokeWidth="1"
                  opacity="0.6"
                />
              </g>

              {/* Nearby features (simulated) */}
              <g opacity="0.5">
                <rect x="350" y="200" width="60" height="40" fill="#8b6f47" rx="2" />
                <rect x="600" y="250" width="50" height="35" fill="#8b6f47" rx="2" />
                <circle cx="450" cy="420" r="8" fill="#4a90e2" />
              </g>

              {/* Grid overlay (subtle) */}
              <g stroke="#cbd5e1" strokeWidth="0.5" opacity="0.1">
                {[...Array(10)].map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * 100}
                    y1="0"
                    x2={i * 100}
                    y2="600"
                  />
                ))}
                {[...Array(6)].map((_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={i * 100}
                    x2="1000"
                    y2={i * 100}
                  />
                ))}
              </g>

              {/* Compass rose (top right) */}
              <g transform="translate(900, 50)">
                <circle cx="0" cy="0" r="25" fill="white" opacity="0.9" />
                <text
                  x="0"
                  y="-12"
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#1e293b"
                >
                  N
                </text>
                <path
                  d="M 0 -18 L 5 -8 L 0 -5 L -5 -8 Z"
                  fill="#f97316"
                />
              </g>

              {/* Scale bar (bottom right) */}
              <g transform="translate(850, 550)">
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="3"
                  fill="#1e293b"
                />
                <text
                  x="50"
                  y="20"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#1e293b"
                >
                  0.5 mi
                </text>
              </g>
            </svg>

            {/* Info Overlays */}
            {/* Top left - Location info */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-md z-10 max-w-xs">
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900">Address</p>
                  <p className="text-sm text-slate-700 truncate">{address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mountain className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Elevation</p>
                  <p className="text-sm text-slate-700">{elevation.toLocaleString()} ft</p>
                </div>
              </div>
            </div>

            {/* Bottom left - Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-md text-xs z-10">
              <p className="font-semibold text-slate-900 mb-2">Topographic Legend</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#2d5a4a' }}></div>
                  <span className="text-slate-700">Peak Elevation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#5a9f7a' }}></div>
                  <span className="text-slate-700">High Terrain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#7dd3c0' }}></div>
                  <span className="text-slate-700">Lower Elevation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-slate-700">Property Location</span>
                </div>
              </div>
            </div>

            {/* Bottom right - Coordinates */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-md text-xs z-10">
              <p className="font-semibold text-slate-900 mb-1">Coordinates</p>
              <p className="text-slate-700 font-mono text-xs">
                {latitude.toFixed(4)}° N
              </p>
              <p className="text-slate-700 font-mono text-xs">
                {Math.abs(longitude).toFixed(4)}° W
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">📍 Overhead 3D Topographic View</span>
          <span className="text-slate-500">Telluride, Colorado</span>
        </div>
      </div>
    </Card>
  );
}
