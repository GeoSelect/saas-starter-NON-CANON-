import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, ShieldAlert } from "lucide-react";

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
};

type ParcelDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: ParcelResult | null;
  onCreateReport: () => void;
  onGatedAction: (label: string) => void;
  variant?: "mobile" | "desktop";
};

export function ParcelDetailsSheet({
  open,
  onOpenChange,
  parcel,
  onCreateReport,
  onGatedAction,
  variant = "desktop",
}: ParcelDetailsSheetProps) {
  const isMobile = variant === "mobile";
  const sheetHeight = isMobile ? "h-[80vh]" : "h-[70vh] sm:h-[70vh]";
  const scrollHeight = isMobile ? "h-[calc(80vh-120px)]" : "h-full";

  if (!parcel) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className={sheetHeight}>
          <SheetHeader>
            <SheetTitle>Parcel summary</SheetTitle>
          </SheetHeader>
          <div className="mt-6 text-sm text-muted-foreground">
            Pick a parcel from the list to see details.
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetHeight}>
        <SheetHeader>
          <SheetTitle>Parcel summary</SheetTitle>
        </SheetHeader>
        <ScrollArea className={`mt-4 ${scrollHeight}`}>
          <div className={`space-y-4 ${isMobile ? "pr-4" : ""}`}>
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

            <Separator />

            <div className="space-y-2">
              {isMobile && <p className="text-sm font-semibold">Actions</p>}
              <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
                <Button className="flex-1 h-11" onClick={() => onGatedAction("Save parcel")}>
                  Save parcel
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 h-11"
                  onClick={onCreateReport}
                >
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
