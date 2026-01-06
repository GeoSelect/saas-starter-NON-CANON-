"use client";

import React, { useState, useEffect } from "react";
import { ParcelSnapshotDrawer } from "@/components/parcel/ParcelSnapshotDrawer";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

// Custom hook for geocoding (can be moved to its own file)
function useParcelData(address: string) {
  const [parcel, setParcel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Google Maps API key missing");
      setParcel(null);
      return;
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "OK") {
          const result = data.results[0];
          setParcel({
            address: result.formatted_address,
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            apn: result.place_id,
            placeId: result.place_id,
            sources: ["Google Maps"],
            notes: result.formatted_address,
          });
          setError(null);
        } else {
          setParcel(null);
          setError("Address not found");
        }
      })
      .catch(() => {
        setParcel(null);
        setError("Failed to fetch parcel data");
      });
  }, [address]);

  return { parcel, error };
}

export default function ParcelSummaryPage() {
  const [inputValue, setInputValue] = useState("Telluride, CO");
  const [searchAddress, setSearchAddress] = useState("Telluride, CO");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { parcel, error } = useParcelData(searchAddress);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <APIProvider apiKey={apiKey || ""}>
      <div className="space-y-6 max-w-xl mx-auto p-4">
        <form
          className="flex gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchAddress(inputValue);
            setDrawerOpen(true);
          }}
        >
          <input
            className="flex-1 border rounded px-3 py-2"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter an address..."
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            type="submit"
          >
            Search parcels
          </button>
        </form>
        {error && <div className="p-4 text-red-600">{error}</div>}
        {parcel && parcel.lat && parcel.lng && (
          <div className="h-96 w-full rounded overflow-hidden border">
            <Map
              defaultCenter={{ lat: parcel.lat, lng: parcel.lng }}
              defaultZoom={16}
              mapId={undefined}
              gestureHandling="greedy"
              tilt={45}
              heading={0}
              mapTypeId="satellite"
            >
              <Marker position={{ lat: parcel.lat, lng: parcel.lng }} />
            </Map>
          </div>
        )}
        {parcel && (
          <ParcelSnapshotDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            parcel={parcel}
          />
        )}
      </div>
    </APIProvider>
  );
}
