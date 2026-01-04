'use client';

import { useActionState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createReport } from '@/app/(dashboard)/reports/actions';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/observability/logger';
import type { ParcelResult } from './ParcelDetailsSheet';

type SaveReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: ParcelResult | null;
  onSuccess?: (reportId: string) => void;
};

export function SaveReportDialog({
  open,
  onOpenChange,
  parcel,
  onSuccess,
}: SaveReportDialogProps) {
  const [state, formAction, pending] = useActionState(createReport, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Monitor state changes and handle success
  useEffect(() => {
    if (state?.reportId && !pending) {
      logger.info('report_create_success', {
        reportId: state.reportId,
        title: state.title,
      });
      onSuccess?.(state.reportId);
      formRef.current?.reset();
      onOpenChange(false);
    } else if (state?.error && !pending) {
      logger.warn('report_create_failed', {
        error: state.error,
        title: state.title,
      });
    }
  }, [state?.reportId, state?.error, pending, onSuccess, onOpenChange, state?.title]);

  const handleSubmit = (formData: FormData) => {
    if (!parcel) return;
    
    const title = formData.get('title') as string;
    logger.debug('report_create_start', {
      address: parcel.address,
      title,
    });
    
    // Append parcel data as JSON string
    formData.append('parcelData', JSON.stringify(parcel));
    
    // Pass to server action
    formAction(formData);
  };

  if (!parcel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Report</DialogTitle>
          <DialogDescription>
            Create an immutable snapshot of this parcel's intelligence
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., 'Zoning Review - 123 Main St'"
              defaultValue={`Report: ${parcel.address}`}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Add notes about why you're creating this report..."
              rows={3}
              className="mt-2 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Snapshot includes:</strong> Address, APN, jurisdiction, zoning, coordinates, sources, and notes
            </p>
          </div>

          {state?.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {state.success}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
