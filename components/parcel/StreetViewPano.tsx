"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type StreetViewPanoProps = {
  lat: number;
  lng: number;
  height?: number;
};

let googleMapsLoaded = false;
const loadPromise = new Promise<void>((resolve) => {
  if (typeof window === "undefined") return;

  (window as any).__googleMapsLoadCallback = () => {
    googleMapsLoaded = true;
    resolve();
  };
});

export function StreetViewPano({ lat, lng, height = 220 }: StreetViewPanoProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    async function initStreetView() {
      try {
        if (!containerRef.current) return;

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
        if (!apiKey) {
          setError("Google Maps API key not configured");
          setLoading(false);
          return;
        }

        // Load the Maps API using callback pattern (like Google's example)
        if (!googleMapsLoaded && !(window as any).google?.maps) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__googleMapsLoadCallback`;
          script.async = true;
          script.defer = true;

          document.head.appendChild(script);
          await loadPromise;
        }

        // Wait a bit more to ensure API is fully initialized
        await new Promise((resolve) => setTimeout(resolve, 300));

        const google = (window as any).google;
        if (!google?.maps?.StreetViewPanorama) {
          setError("Street View API not available");
          setLoading(false);
          return;
        }

        // Initialize Street View Panorama
        const panorama = new google.maps.StreetViewPanorama(containerRef.current, {
          position: { lat, lng },
          pov: {
            heading: 210,
            pitch: 10,
          },
          zoom: 1,
          addressControl: true,
          addressControlOptions: {
            position: google.maps.ControlPosition.BOTTOM_CENTER,
          },
          panControl: true,
          zoomControl: true,
          motionTracking: true,
          motionTrackingControl: true,
        });

        // Handle Street View loading errors
        const handlePanoChanged = () => {
          const pano = panorama.getPano();
          if (!pano) {
            setError("No Street View imagery available for this location");
            setLoading(false);
            return;
          }
          setLoading(false);
        };

        panorama.addListener("pano_changed", handlePanoChanged);
        handlePanoChanged(); // Check initial state

        // Set a timeout in case Street View doesn't load
        const timeout = setTimeout(() => {
          setError("Street View failed to load (timeout)");
          setLoading(false);
        }, 8000);

        return () => {
          clearTimeout(timeout);
          google.maps.event.clearListeners(panorama, "pano_changed");
        };
      } catch (err: any) {
        setError(err?.message || "Failed to initialize Street View");
        setLoading(false);
      }
    }

    void initStreetView();
  }, [lat, lng]);

  if (loading) {
    return <Skeleton style={{ height }} className="w-full rounded-lg" />;
  }

  if (error) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="overflow-hidden rounded-lg border bg-muted"
    />
  );
}
