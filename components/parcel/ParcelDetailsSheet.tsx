import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExportPdfButton } from "@/components/ui/ExportPdfButton";
import jsPDF from "jspdf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, ShieldAlert, Snapshot } from "lucide-react";
import { Home, Info } from "lucide-react";

export type ParcelResult = {
  id: string;
  address: string;
  jurisdiction: string;
  zoning: string;
  apn: string;
  sources: string[];
  notes: string;
  lat?: number | null;
  lng?: number | null;
}

export function ParcelDetailsSheet({ parcel, open, onOpenChange, sheetHeight, scrollHeight, isMobile, onGatedAction, onCreateReport }: any) {
  function handleExportPdf() {
    if (!parcel) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Parcel Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Address: ${parcel.address}`, 20, 35);
    doc.text(`APN: ${parcel.apn}`, 20, 45);
    doc.text(`Jurisdiction: ${parcel.jurisdiction}`, 20, 55);
    doc.text(`Zoning: ${parcel.zoning}`, 20, 65);
    doc.text(`Sources: ${parcel.sources.join(", ")}`, 20, 75);
    doc.text(`Notes: ${parcel.notes}`, 20, 85);
    doc.save(`parcel-report-${parcel.id}.pdf`);
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetHeight}>
        <SheetHeader>
          <SheetTitle>Parcel summary</SheetTitle>
        </SheetHeader>
        <ScrollArea className={`mt-4 ${scrollHeight}`}>
          <div className={`space-y-4 ${isMobile ? "pr-4" : ""}`}>
            {!parcel ? (
              <div className="mt-6 text-sm text-muted-foreground">Pick a parcel from the list to see details.</div>
            ) : (
              <div>
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
                    <AccordionContent className="text-sm text-muted-foreground">
                      {parcel.notes}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
              
            <Separator />

            <div className="space-y-2">
              {isMobile && <p className="text-sm font-semibold">Actions</p>}
              <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
                <Button className="flex-1 h-11" onClick={() => onGatedAction("Save to Workspace")}>\n                  Save to Workspace\n                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 h-11"
                  onClick={onCreateReport}
                >
                  More Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <ExportPdfButton onClick={handleExportPdf} />
              </div>
              {isMobile && (
                <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                  <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p className="text-xs">Create an account to build your workspace.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        {/* Bottom container and footer */}
        <div className="w-full border-t pt-3 pb-4 bg-background flex flex-col items-center">
          <div className="flex gap-4 mb-2">
            <Button variant="ghost" size="icon" aria-label="Home" onClick={() => onGatedAction("Go Home")}> 
              <Home className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Details" onClick={onCreateReport}>
              <Info className="h-6 w-6" />
            </Button>
          </div>
          <footer className="text-xs text-muted-foreground">© {new Date().getFullYear()} GeoSelect</footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
