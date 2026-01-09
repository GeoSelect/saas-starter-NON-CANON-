"use client";

import * as React from "react";
import { MapPin, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CtaBar } from "@/components/ux/CtaBar";

export function SearchPanel({
  query,
  setQuery,
  searching,
  onSearch,
  geoLoading,
  onUseMyLocation,
}: {
  query: string;
  setQuery: (v: string) => void;
  searching: boolean;
  onSearch: () => void | Promise<void>;
  geoLoading: boolean;
  onUseMyLocation: () => void | Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          Parcel IQ
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time parcel search with context-aware summaries
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="query">Search by address, city, or APN</Label>
          <Input
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="1600 Amphitheatre Parkway, Mountain View, CA"
            className="h-11"
            onKeyDown={(e) => {
              if (e.key === "Enter") void onSearch();
            }}
          />
        </div>

        <CtaBar
          ctas={[
            {
              id: "search",
              label: searching ? "Searching..." : "Search parcels",
              onClick: onSearch,
              loading: searching,
              disabled: query.trim().length === 0,
            },
            {
              id: "mylocation",
              label: geoLoading ? "Getting location..." : "Use my location",
              onClick: onUseMyLocation,
              variant: "outline",
              iconLeft: <MapPin className="h-4 w-4" />,
              loading: geoLoading,
              disabled: searching,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}
