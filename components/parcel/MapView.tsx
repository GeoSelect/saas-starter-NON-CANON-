"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Simple OpenLayers wrapper that only renders on the client.
// Falls back gracefully if OpenLayers is not available in the bundle.
type MapCanvasProps = {
  height?: number;
};

function MapCanvas({ height = 240 }: MapCanvasProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let map: any;

    async function load() {
      try {
        // We intentionally ignore TS resolution because OpenLayers is optional in this build.
        const [Map, View, TileLayer, OSM] = await Promise.all([
          // @ts-ignore Optional dependency loaded at runtime
          import("ol/Map").then((m) => m.default).catch(() => null),
          // @ts-ignore Optional dependency loaded at runtime
          import("ol/View").then((m) => m.default).catch(() => null),
          // @ts-ignore Optional dependency loaded at runtime
          import("ol/layer/Tile").then((m) => m.default).catch(() => null),
          // @ts-ignore Optional dependency loaded at runtime
          import("ol/source/OSM").then((m) => m.default).catch(() => null),
        ]);

        if (!mapRef.current || !Map || !View || !TileLayer || !OSM) return;

        map = new Map({
          target: mapRef.current,
          layers: [new TileLayer({ source: new OSM() })],
          view: new View({ center: [-11724973, 4865942], zoom: 4 }),
        });
      } catch (err) {
        console.warn("OpenLayers failed to load; showing fallback", err);
      }
    }

    void load();

    return () => {
      if (map && typeof map.setTarget === "function") {
        map.setTarget(undefined);
      }
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <div ref={mapRef} style={{ height }} className="w-full bg-muted" />
    </Card>
  );
}

const MapView = dynamic(async () => MapCanvas, {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full" />,
});

export { MapView };
