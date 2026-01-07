"use client";

import React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";

const NAV_LINKS = [
  { href: "/mobile-onboarding-choice", label: "Mobile Onboarding" },
  { href: "/reports", label: "Reports" },
  { href: "/dashboard/security", label: "Dashboard Security" },
  { href: "/dashboard/general", label: "Dashboard General" },
  { href: "/pricing", label: "Pricing" },
  { href: "/all-components", label: "All Components" },
];

const DASHBOARD_LINKS = [
  { href: "/parcel/resolve", label: "Parcel Resolve" },
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
            <div className="mb-4">
              <WorkspaceSwitcher />
            </div>
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
            <div className="mt-6 border-t pt-4">
              <div className="mb-2 text-xs font-semibold text-gray-500">Dashboard</div>
              {DASHBOARD_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-2 px-3 rounded bg-orange-50 hover:bg-orange-100 text-base font-medium text-orange-700 border border-orange-200 mb-2 block text-center"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
