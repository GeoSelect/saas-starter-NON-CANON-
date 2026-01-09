"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CtaSpec = {
  id: string;
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "default" | "outline" | "secondary" | "ghost";
  iconLeft?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
};

export function CtaBar({ ctas }: { ctas: CtaSpec[] }) {
  return (
    <div className="flex flex-col gap-2">
      {ctas.map((c) => (
        <Button
          key={c.id}
          variant={c.variant ?? "default"}
          onClick={() => void c.onClick()}
          disabled={c.disabled || c.loading}
          className="w-full gap-2"
        >
          {c.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : c.iconLeft}
          {c.loading ? "Working..." : c.label}
        </Button>
      ))}
    </div>
  );
}
