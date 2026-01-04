import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParcelAccordion } from "./ParcelAccordion";
import type { ParcelResult } from "./ParcelDetailsSheet";

export type ParcelSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: ParcelResult | null;
  onCreateReport: () => void;
  onGatedAction: (label: string) => void;
  variant?: "mobile" | "desktop";
};

export function ParcelSheet({
  open,
  onOpenChange,
  parcel,
  onCreateReport,
  onGatedAction,
  variant = "desktop",
}: ParcelSheetProps) {
  const isMobile = variant === "mobile";
  const sheetHeight = isMobile ? "h-[80vh]" : "h-[70vh] sm:h-[70vh]";
  const scrollHeight = isMobile ? "h-[calc(80vh-120px)]" : "h-full";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetHeight}>
        <SheetHeader>
          <SheetTitle>Parcel summary</SheetTitle>
        </SheetHeader>

        {!parcel ? (
          <div className="mt-6 text-sm text-muted-foreground">Pick a parcel from the list to see details.</div>
        ) : (
          <ScrollArea className={`mt-4 ${scrollHeight}`}>
            <div className={`space-y-4 ${isMobile ? "pr-4" : ""}`}>
              <ParcelAccordion
                parcel={parcel}
                onCreateReport={onCreateReport}
                onGatedAction={onGatedAction}
                variant={variant}
              />
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
