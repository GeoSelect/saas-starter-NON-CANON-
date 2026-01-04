"use client";

import * as React from "react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { ParcelResult } from "./ParcelDetailsSheet";

export type ParcelResolveResponse = {
  results: ParcelResult[];
  meta?: { count?: number; stubbed?: boolean };
};

export function useParcelResolve() {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [parcels, setParcels] = React.useState<ParcelResult[]>([]);
  const [active, setActive] = React.useState<ParcelResult | null>(null);
  const [openSheet, setOpenSheet] = React.useState(false);

  // Subscribe to real-time parcel changes
  React.useEffect(() => {
    const supabase = supabaseBrowser();
    
    const channel = supabase
      .channel("parcels-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parcels"
        },
        (payload) => {
          console.log("Parcel change detected:", payload);
          // Refresh parcels list if query is active
          if (query.trim()) {
            void handleSearch();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleSearch(e?: React.FormEvent, overrideQuery?: string) {
    e?.preventDefault();
    const searchTerm = (overrideQuery ?? query).trim();
    if (!searchTerm) {
      toast.error("Enter an address or APN");
      return;
    }

    setLoading(true);
    setParcels([]);
    setActive(null);
    
    try {
      const supabase = supabaseBrowser();
      
      // Search parcels by address or APN using ilike for case-insensitive matching
      const { data, error } = await supabase
        .from("parcels")
        .select("id, address, jurisdiction, zoning, apn, sources, notes, lat, lng")
        .or(`address.ilike.%${searchTerm}%,apn.ilike.%${searchTerm}%`)
        .limit(20);

      if (error) {
        throw new Error(error.message);
      }

      const results: ParcelResult[] = (data || []).map((row) => ({
        id: row.id,
        address: row.address,
        jurisdiction: row.jurisdiction,
        zoning: row.zoning,
        apn: row.apn,
        sources: Array.isArray(row.sources) ? row.sources : [],
        notes: row.notes || "",
        lat: row.lat ?? null,
        lng: row.lng ?? null,
      }));

      setParcels(results);
      toast("Results refreshed", { description: `${results.length} parcels found` });
    } catch (err: any) {
      toast.error("Lookup failed", { description: err?.message ?? "Unexpected error" });
      
      // Fallback to API endpoint if Supabase query fails
      try {
        const res = await fetch("/api/parcel/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchTerm, mode: "text", limit: 20 }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.message || "Failed to resolve parcel");
        }

        const data = (await res.json()) as ParcelResolveResponse;
        setParcels(data.results ?? []);
        toast("Results loaded (fallback)", { description: `${data.results?.length ?? 0} parcels found` });
      } catch (fallbackErr: any) {
        toast.error("Fallback also failed", { description: fallbackErr?.message ?? "Unexpected error" });
      }
    } finally {
      setLoading(false);
    }
  }

  function openParcel(parcel: ParcelResult) {
    setActive(parcel);
    setOpenSheet(true);
  }

  async function createReport() {
    if (!active) {
      toast.error("Select a parcel first");
      return;
    }

    try {
      const res = await fetch("/api/report/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-account-id": "demo-account",
        },
        body: JSON.stringify({
          parcel_id: active.apn,
          title: `Parcel IQ report for ${active.address}`,
          address: active.address,
          jurisdiction: active.jurisdiction,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("Sign in to create reports", {
          description: "Create an account to unlock report creation."
        });
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to create report");
      }

      const data = await res.json();
      const url = data?.cta?.url ?? "";
      toast.success("Report created", {
        description: url || "Your report is ready."
      });
    } catch (err: any) {
      toast.error("Report creation failed", { description: err?.message ?? "Unexpected error" });
    }
  }

  function gatedAction(label: string) {
    toast.warning(`${label} requires an account`, {
      description: "Create an account to save parcels, snapshots, and reports."
    });
  }

  return {
    query,
    setQuery,
    loading,
    parcels,
    active,
    openSheet,
    setOpenSheet,
    handleSearch,
    openParcel,
    createReport,
    gatedAction,
  };
}
