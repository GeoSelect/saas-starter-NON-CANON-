"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

interface SnapshotWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcelAddress: string;
  onConfirm: (notesText: string) => Promise<void>;
}

export function SnapshotWarningDialog({
  open,
  onOpenChange,
  parcelAddress,
  onConfirm,
}: SnapshotWarningDialogProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!notes.trim()) {
      toast.error("Please add a note explaining why you're capturing this parcel");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(notes);
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating snapshot:", error);
      toast.error("Failed to create snapshot");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Create Snapshot
          </DialogTitle>
          <DialogDescription>
            This will create an immutable record of this parcel's context. The snapshot
            cannot be modified after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-amber-500 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Evidence will be frozen</AlertTitle>
            <AlertDescription className="text-amber-800">
              Once created, this snapshot is permanent and timestamped. All sources and
              constraints captured now become part of the historical record.
            </AlertDescription>
          </Alert>

          <div className="rounded bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">Parcel:</p>
            <p className="text-sm text-gray-600">{parcelAddress}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Why are you capturing this parcel?</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., 'Client inquiry', 'Boundary clarification needed', 'Zoning verification'"
              className="h-24 w-full rounded border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="gap-2">
            {loading ? "Creating..." : "Create Snapshot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
