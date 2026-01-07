/**
 * CCP-04: Parcel Search Form Component
 *
 * User input for searching parcels by address, parcel ID, or coordinates
 */

"use client";

import { useState } from "react";
import { ParcelSearchInput } from "@/lib/types/parcel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Search } from "lucide-react";

interface ParcelSearchFormProps {
  onSearch: (input: ParcelSearchInput) => Promise<void>;
  loading?: boolean;
}

export function ParcelSearchForm({ onSearch, loading }: ParcelSearchFormProps) {
  const [address, setAddress] = useState("");
  const [parcelId, setParcelId] = useState("");
  const [searchType, setSearchType] = useState<"address" | "parcel_id">("address");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input: ParcelSearchInput = {};

    if (searchType === "address" && address.trim()) {
      input.address = address.trim();
    } else if (searchType === "parcel_id" && parcelId.trim()) {
      input.parcel_id = parcelId.trim();
    }

    if (!input.address && !input.parcel_id) {
      alert("Please enter a search query");
      return;
    }

    try {
      await onSearch(input);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSearchType("address")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            searchType === "address"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Address
        </button>
        <button
          type="button"
          onClick={() => setSearchType("parcel_id")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            searchType === "parcel_id"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Parcel ID
        </button>
      </div>

      <div className="flex gap-2">
        {searchType === "address" ? (
          <Input
            type="text"
            placeholder="Enter address (e.g., 123 Main St, Telluride, CO)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />
        ) : (
          <Input
            type="text"
            placeholder="Enter parcel ID"
            value={parcelId}
            onChange={(e) => setParcelId(e.target.value)}
            disabled={loading}
          />
        )}
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
