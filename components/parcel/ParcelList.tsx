"use client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ParcelResult } from "./ParcelDetailsSheet";

type ParcelListProps = {
  parcels: ParcelResult[];
  loading: boolean;
  onSelect: (parcel: ParcelResult) => void;
  variant?: "mobile" | "desktop";
};

export function ParcelList({ parcels, loading, onSelect, variant = "desktop" }: ParcelListProps) {
  const isMobile = variant === "mobile";

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: isMobile ? 3 : 4 }).map((_, idx) => (
          <div key={idx} className="space-y-2 rounded-lg border p-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
        ))}
      </div>
    );
  }

  if (parcels.length === 0) {
    return null;
  }

  const content = (
    <div className={`space-y-3 ${isMobile ? "" : "pr-3"}`}>
      {parcels.map((parcel) => (
        <button
          key={parcel.id}
          onClick={() => onSelect(parcel)}
          className="w-full text-left"
        >
          <div className={`rounded-lg border p-3 transition hover:border-primary ${isMobile ? "active:bg-muted" : ""}`}>
            <div className={`flex ${isMobile ? "flex-wrap" : ""} items-center gap-2 ${isMobile ? "mb-2" : ""}`}>
              <Badge variant="outline" className={isMobile ? "text-xs" : ""}>{parcel.jurisdiction}</Badge>
              <span className="text-xs text-muted-foreground">{parcel.zoning}</span>
            </div>
            <p className={`${isMobile ? "text-sm" : "mt-2 text-sm"} font-semibold text-foreground`}>
              {parcel.address}
            </p>
            <p className="text-xs text-muted-foreground">APN {parcel.apn}</p>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{parcel.notes}</p>
          </div>
        </button>
      ))}
    </div>
  );

  if (isMobile) {
    return <ScrollArea className="h-[400px]">{content}</ScrollArea>;
  }

  return <ScrollArea className="h-[440px]">{content}</ScrollArea>;
}
