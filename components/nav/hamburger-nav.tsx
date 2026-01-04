"use client";

import React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/mobile-onboarding-choice", label: "Mobile Onboarding" },
  { href: "/reports", label: "Reports" },
  { href: "/dashboard/security", label: "Dashboard Security" },
  { href: "/parcel/resolve", label: "Parcel Resolve" },
  { href: "/dashboard/general", label: "Dashboard General" },
  { href: "/all-components", label: "All Components" },
];

export function HamburgerNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open navigation"
        className="md:hidden"
        onClick={() => setOpen((v) => !v)}
        style={{ position: "fixed", top: 16, left: 16, zIndex: 1000 }}
      >
        <Menu className="h-6 w-6" />
      </Button>
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[1000]"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute top-0 left-0 w-64 h-full bg-white shadow-lg p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-lg font-bold">Navigation</div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 px-3 rounded hover:bg-gray-100 text-base font-medium"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
