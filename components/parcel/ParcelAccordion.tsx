import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ShieldAlert, Save } from "lucide-react";
import { StreetViewPano } from "./StreetViewPano";
import { SaveReportDialog } from "./SaveReportDialog";
import type { ParcelResult } from "./ParcelDetailsSheet";

export type ParcelAccordionProps = {
  parcel: ParcelResult;
  onCreateReport: () => void;
  onGatedAction: (label: string) => void;
  variant?: "mobile" | "desktop";
};

export function ParcelAccordion({ parcel, onCreateReport, onGatedAction, variant = "desktop" }: ParcelAccordionProps) {
  const isMobile = variant === "mobile";
  const [saveReportOpen, setSaveReportOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{parcel.address}</p>
        <p className="text-xs text-muted-foreground">APN {parcel.apn}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{parcel.jurisdiction}</Badge>
          <Badge variant="secondary">{parcel.zoning}</Badge>
        </div>
      </div>

      <Separator />

      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="jurisdiction">
          <AccordionTrigger className="text-sm font-medium">Jurisdiction</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            <p>Primary jurisdiction: {parcel.jurisdiction}</p>
            <p className="mt-1">Zoning: {parcel.zoning}</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="streetview">
          <AccordionTrigger className="text-sm font-medium">Street View</AccordionTrigger>
          <AccordionContent className="space-y-2">
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
              <p className="text-xs text-muted-foreground">
                Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to enable the embedded Street View tray.
              </p>
            )}
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && typeof parcel.lat === "number" && typeof parcel.lng === "number" && (
              <StreetViewPano lat={parcel.lat} lng={parcel.lng} height={isMobile ? 220 : 260} />
            )}
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (typeof parcel.lat !== "number" || typeof parcel.lng !== "number") && (
              <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  Coordinates not available for this parcel. Street View requires lat/lng.
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="sources">
          <AccordionTrigger className="text-sm font-medium">Sources</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            {parcel.sources.map((src) => (
              <div key={src} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full bg-primary ${isMobile ? "flex-shrink-0" : ""}`} />
                <span>{src}</span>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="notes">
          <AccordionTrigger className="text-sm font-medium">Notes</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">{parcel.notes}</AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      <div className="space-y-2">
        {isMobile && <p className="text-sm font-semibold">Actions</p>}
        <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
          <Button 
            className="flex-1 h-11 gap-2" 
            variant="outline"
            onClick={() => setSaveReportOpen(true)}
          >
            <Save className="h-4 w-4" />
            Save Report
          </Button>
          <Button variant="secondary" className="flex-1 h-11" onClick={onCreateReport}>
            Create report
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {isMobile && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-900">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p className="text-xs">Create an account to unlock saving and reports.</p>
          </div>
        )}
      </div>

      <SaveReportDialog 
        open={saveReportOpen} 
        onOpenChange={setSaveReportOpen} 
        parcel={parcel}
      />
    </div>
  );
}
