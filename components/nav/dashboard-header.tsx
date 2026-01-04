"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background w-full">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        <Button variant="ghost" size="icon" aria-label="Open navigation" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="text-lg font-bold tracking-tight">
          GeoSelect.it
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {/* Add account controls or workspace switcher here */}
        </div>
      </div>
    </header>
  );
}
