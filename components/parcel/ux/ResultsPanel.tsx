"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ParcelList } from "@/components/parcel/ParcelList";
import { ParcelDetailsSheet } from "@/components/parcel/ParcelDetailsSheet";

export function ResultsPanel({
  parcels,
  loading,
  onCreateReport,
  onGatedAction,
}: {
  parcels: Array<any>;
  loading: boolean;
  onCreateReport: (parcel: any) => void | Promise<void>;
  onGatedAction: (action: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Results ({parcels.length})</CardTitle>
        <p className="text-xs text-muted-foreground">Expand a parcel to view details.</p>
      </CardHeader>

      <CardContent className="h-full">
        {loading ? (
          <ParcelList parcels={[]} loading={true} onSelect={() => {}} variant="desktop" />
        ) : parcels.length === 0 ? (
          <div className="text-sm text-muted-foreground">No parcels found.</div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {parcels.map((parcel: any) => (
              <AccordionItem key={parcel.id} value={parcel.id}>
                <AccordionTrigger>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-sm">{parcel.address}</span>
                    <span className="text-xs text-muted-foreground">APN {parcel.apn}</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline">{parcel.jurisdiction}</Badge>
                      <Badge variant="secondary">{parcel.zoning}</Badge>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  {/* NOTE: This is currently being used inline. Prefer ParcelDetailsInline long-term. */}
                  <ParcelDetailsSheet
                    open={true}
                    onOpenChange={() => {}}
                    parcel={parcel}
                    onCreateReport={onCreateReport}
                    onGatedAction={onGatedAction}
                    variant="desktop"
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
