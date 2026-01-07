#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

// Adjust these if your dashboard group differs
const DASHBOARD_GROUP_DIR = path.join(repoRoot, "app", "(dashboard)");
const NAV_LIB_DIR = path.join(repoRoot, "lib", "nav");
const NAV_COMPONENT_DIR = path.join(repoRoot, "components", "nav");

const surfaces = [
  {
    id: "parcel",
    title: "Parcel Management",
    href: "/parcel",
    description:
      "Viewing, listing, and managing parcels (components/parcel and app/(dashboard)/parcel).",
  },
  {
    id: "contacts",
    title: "Contact Management",
    href: "/contacts",
    description:
      "Managing contacts and contact groups (components/contacts, app/api/contact, app/api/contact-groups).",
  },
  {
    id: "governance",
    title: "Governance Warnings",
    href: "/governance",
    description:
      "Displaying and handling governance warnings (components/governance, app/api/governance-warnings).",
  },
  {
    id: "reports",
    title: "Reports",
    href: "/reports",
    description:
      "Generating, listing, and sharing reports (app/(dashboard)/reports, app/api/report, app/api/reports, components/share).",
  },
  {
    id: "auth",
    title: "User Authentication",
    href: "/auth",
    description:
      "Login, sign-up, magic link, and session management (app/(login), app/api/auth, app/api/session, app/api/magic-link).",
  },
  {
    id: "workspace",
    title: "Team & Workspace",
    href: "/workspace",
    description:
      "Managing teams, roles, permissions, and workspaces (app/api/team, app/api/roles, app/api/permissions, app/api/workspace, app/api/workspaces).",
  },
  {
    id: "sharing",
    title: "Sharing",
    href: "/sharing",
    description:
      "Share links, shared reports, and access control (app/api/share-links, app/share, components/share).",
  },
  {
    id: "billing",
    title: "Stripe Payments",
    href: "/billing",
    description: "Payment and billing integration (app/api/stripe, lib/payments).",
  },
  {
    id: "observability",
    title: "Audit & Observability",
    href: "/observability",
    description:
      "Tracking actions and system health (lib/audit, docs/audit-logging.md, docs/OBSERVABILITY.md).",
  },
  {
    id: "location",
    title: "Map & Location",
    href: "/location",
    description:
      "Map views, street view, and location-based features (components/parcel/MapView, StreetViewPano, app/api/location).",
  },
  {
    id: "snapshots",
    title: "Snapshot & Telemetry",
    href: "/snapshots",
    description:
      "Snapshots of data and telemetry for analytics (app/api/snapshots, app/api/telemetry).",
  },
  {
    id: "mobile-onboarding",
    title: "Mobile Onboarding",
    href: "/mobile-onboarding",
    description:
      "Mobile-specific onboarding flows (app/(dashboard)/mobile-onboarding-choice).",
  },
  {
    id: "errors",
    title: "Error Handling",
    href: "/errors",
    description:
      "Error boundaries and dialogs (components/error-boundary.tsx, components/governance/governance-warning-dialog.tsx).",
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function routeDirFromHref(href) {
  // "/mobile-onboarding" -> "mobile-onboarding"
  return href.replace(/^\//, "");
}

function pageTemplate(surface) {
  return `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ${pascal(surface.id)}Page() {
  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">${escapeJsx(surface.title)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>${escapeJsx(surface.description)}</p>
          <p className="text-xs">
            Route: <span className="font-mono">${escapeJsx(surface.href)}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

function escapeJsx(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pascal(str) {
  return String(str)
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function createPages() {
  ensureDir(DASHBOARD_GROUP_DIR);

  for (const s of surfaces) {
    const dirName = routeDirFromHref(s.href);
    const routeDir = path.join(DASHBOARD_GROUP_DIR, dirName);
    ensureDir(routeDir);

    const pagePath = path.join(routeDir, "page.tsx");
    if (fs.existsSync(pagePath)) continue;

    writeFile(pagePath, pageTemplate(s));
  }
}

function writeNavConfig() {
  ensureDir(NAV_LIB_DIR);

  const content = `export type SurfaceNavItem = {
  id: string;
  title: string;
  href: string;
  description?: string;
};

export const SURFACE_NAV: SurfaceNavItem[] = ${JSON.stringify(surfaces, null, 2)};
`;

  writeFile(path.join(NAV_LIB_DIR, "surfaces.ts"), content);
}

function writeHamburgerNavComponent() {
  ensureDir(NAV_COMPONENT_DIR);

  const content = `"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SURFACE_NAV } from "@/lib/nav/surfaces";

export function HamburgerNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>

        <nav className="mt-6 space-y-1">
          {SURFACE_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={[
                  "block rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <div className="font-medium text-foreground">{item.title}</div>
                {item.description ? (
                  <div className="text-xs text-muted-foreground line-clamp-2">{item.description}</div>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
`;

  writeFile(path.join(NAV_COMPONENT_DIR, "hamburger-nav.tsx"), content);
}

function writeSidebarComponent() {
  ensureDir(NAV_COMPONENT_DIR);

  const content = `import Link from "next/link";
import { SURFACE_NAV } from "@/lib/nav/surfaces";

export function SidebarNav({ activePath }: { activePath: string }) {
  return (
    <aside className="hidden md:block w-72 shrink-0 border-r">
      <div className="p-4">
        <div className="text-sm font-semibold">Surfaces</div>
      </div>

      <nav className="px-2 pb-4 space-y-1">
        {SURFACE_NAV.map((item) => {
          const active = activePath === item.href || activePath.startsWith(item.href + "/");
          return (
            <Link
              key={item.id}
              href={item.href}
              className={[
                "block rounded-xl px-3 py-2 text-sm transition",
                active ? "bg-accent" : "hover:bg-accent/50",
              ].join(" ")}
            >
              <div className="font-medium">{item.title}</div>
              {item.description ? (
                <div className="text-xs text-muted-foreground line-clamp-2">{item.description}</div>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
`;

  writeFile(path.join(NAV_COMPONENT_DIR, "sidebar-nav.tsx"), content);
}

function main() {
  createPages();
  writeNavConfig();
  writeHamburgerNavComponent();
  writeSidebarComponent();

  console.log("Generated:");
  console.log("- Dashboard surface pages in app/(dashboard)/*/page.tsx");
  console.log("- Nav config in lib/nav/surfaces.ts");
  console.log("- Hamburger nav in components/nav/hamburger-nav.tsx");
  console.log("- Sidebar nav in components/nav/sidebar-nav.tsx");
}

main();
