"use client";

import { Button } from './button';
import { FileText } from 'lucide-react';

export function ExportPdfButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" className="gap-2" onClick={onClick}>
      <FileText className="h-4 w-4" />
      Export PDF
    </Button>
  );
}
