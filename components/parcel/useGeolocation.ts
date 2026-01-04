"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useGeolocation() {
  const [loading, setLoading] = useState(false);

  async function requestLocation(): Promise<{ lat: number; lng: number } | null> {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return null;
    }

    setLoading(true);
    try {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ lat: latitude, lng: longitude });
          },
          (error) => {
            let message = "Failed to get location";
            if (error.code === error.PERMISSION_DENIED) {
              message = "Location permission denied. Enable it in browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = "Your location could not be determined";
            } else if (error.code === error.TIMEOUT) {
              message = "Location request timed out";
            }
            toast.error(message);
            resolve(null);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000, // Cache for 5 minutes
          }
        );
      });
    } finally {
      setLoading(false);
    }
  }

  return { requestLocation, loading };
}
