/**
 * CCP-04: Parcel Resolve Hook
 *
 * useParcelSearch - React hook for searching parcels
 */

"use client";

import { useState, useCallback } from "react";
import { ParcelResult, ParcelSearchInput, ParcelSearchResponse } from "@/lib/types/parcel";

type ParcelSearchState = {
  results: ParcelResult | null;
  loading: boolean;
  error: Error | null;
};

export function useParcelSearch() {
  const [state, setState] = useState<ParcelSearchState>({
    results: null,
    loading: false,
    error: null,
  });

  const search = useCallback(async (input: ParcelSearchInput) => {
    try {
      setState({ results: null, loading: true, error: null });

      const response = await fetch("/api/parcels/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ParcelSearchResponse;
        throw new Error(errorData.error?.message || "Search failed");
      }

      const data = (await response.json()) as ParcelSearchResponse;

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || "Invalid response");
      }

      setState({
        results: data.data,
        loading: false,
        error: null,
      });

      return data.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      setState({
        results: null,
        loading: false,
        error: err,
      });
      throw err;
    }
  }, []);

  return {
    ...state,
    search,
  };
}
