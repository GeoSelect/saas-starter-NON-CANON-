"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StreetViewPano } from "./StreetViewPano";
import { Button } from "@/components/ui/button";

async function handleDownloadPDF(parcel: any) {
  if (!parcel) return;
  const res = await fetch('/api/export-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parcel),
  });
  if (!res.ok) {
    alert('Failed to generate PDF');
    return;
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'parcel-snapshot.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function ParcelSnapshotDrawer({ open, onOpenChange, parcel }: any) {
  if (!parcel) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-lg w-full">
        <SheetHeader>
          <SheetTitle>Parcel Snapshot</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => { /* TODO: implement share logic */ }}>
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(parcel)}>
                Download
              </Button>
            </div>
            <div>
              {/* Street View Panorama above address and APN */}
              {parcel.lat && parcel.lng && (
                <div className="mb-2">
                  <StreetViewPano lat={parcel.lat} lng={parcel.lng} height={220} />
                </div>
              )}
              <h2 className="text-lg font-semibold">
                {parcel.lat && parcel.lng ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${parcel.lat},${parcel.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                  >
                    {parcel.address}
                  </a>
                ) : (
                  parcel.address
                )}
              </h2>
              <p className="text-xs text-muted-foreground">APN: {parcel.apn}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="border rounded px-2 py-0.5">{parcel.jurisdiction}</span>
                <span className="bg-gray-100 rounded px-2 py-0.5">{parcel.zoning}</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium">Sources</h3>
              <ul className="list-disc ml-5 text-sm">
                {parcel.sources?.map((src: string) => (
                  <li key={src}>{src}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Notes</h3>
              <p className="text-sm text-muted-foreground">{parcel.notes}</p>
            </div>
            {/* Add more report sections here as needed */}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
