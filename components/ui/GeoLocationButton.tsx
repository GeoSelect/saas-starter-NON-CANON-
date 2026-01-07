"use client";

import React, { useState } from "react";

export function GeoLocationButton() {
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  };

  return (
    <div>
      <button onClick={handleGetLocation} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white">
        {loading ? "Getting location..." : "Get My Location"}
      </button>
      {location && (
        <div className="mt-2 text-sm">Lat: {location.lat}, Lng: {location.lng}</div>
      )}
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
