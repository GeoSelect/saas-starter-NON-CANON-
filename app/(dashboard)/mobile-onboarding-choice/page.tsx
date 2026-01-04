"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ContactsCsvImport, Contact } from "@/components/contacts/ContactsCsvImport";
  // Handler for CSV import
  function handleContactsImport(contacts: Contact[]) {
    toast.success(`Imported ${contacts.length} contacts (not yet saved)`);
    // TODO: POST contacts to API for batch creation
  }

type Mode = "anonymous" | "accountable";

export default function MobileOnboardingChoicePage() {
  const router = useRouter();

  const [mode, setMode] = React.useState<Mode>("anonymous");
  const [acceptDisclaimer, setAcceptDisclaimer] = React.useState(false);
  const [marketingOptIn, setMarketingOptIn] = React.useState(false);

  function onContinueExploring() {
    if (!acceptDisclaimer) {
      toast.error("Please accept the disclaimer to continue.");
      return;
    }
    toast("Exploring anonymously", {
      description: "You can browse parcels, but saving and sharing require an account."
    });

    // Route this to your Parcel Resolve surface when ready
    router.push("/parcel/resolve");
  }

  function onCreateAccount() {
    toast("Creating an account", {
      description: "You’ll unlock saved parcels, share links, and report creation."
    });

    // Route to your signup/auth flow (update to your actual route)
    router.push("/sign-up");
  }

  const gatedFeatures = [
    "Save parcels",
    "Share report links",
    "Create branded reports",
    "Workspace collaboration"
  ];

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome to GeoSelect.it</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how you want to start. You can explore now and create an account later.
          </p>
        </div>

        <Badge variant={mode === "anonymous" ? "secondary" : "default"}>
          {mode === "anonymous" ? "Anonymous" : "Accountable"}
        </Badge>
      </div>

      <Separator className="my-5" />

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="anonymous">Continue exploring</TabsTrigger>
          <TabsTrigger value="accountable">Create account</TabsTrigger>
        </TabsList>

        {/* Anonymous */}
        <TabsContent value="anonymous" className="mt-4 space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Explore anonymously</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse parcels and jurisdiction context with limited features.
                </p>
              </div>
              <Badge variant="secondary">Limited</Badge>
            </div>

            <Separator className="my-4" />

            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span>Parcel lookup + summary view</span>
                <Badge variant="secondary">Available</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Jurisdiction context sections</span>
                <Badge variant="secondary">Available</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Data sources / provenance</span>
                <Badge variant="secondary">Partial</Badge>
              </li>
              {gatedFeatures.map((f) => (
                <li key={f} className="flex items-center justify-between gap-3">
                  <span>{f}</span>
                  <Badge variant="outline">Gated</Badge>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer gate */}
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Disclaimer</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You must acknowledge this before continuing.
                </p>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-sm font-medium underline underline-offset-4"
                  >
                    Read
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Disclaimer</DialogTitle>
                    <DialogDescription>
                      GeoSelect.it provides informational context and references. It is not legal advice,
                      and accuracy depends on upstream sources. Always verify with authoritative records.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-2 space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Anonymous mode is intended for exploration. Creating an account enables audit trails,
                      saved items, and shareable reports.
                    </p>
                  </div>

                  <DialogFooter className="mt-4">
                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                      onClick={() => toast("Disclaimer viewed")}
                    >
                      Got it
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Checkbox
                id="disclaimer"
                checked={acceptDisclaimer}
                onCheckedChange={(v) => setAcceptDisclaimer(Boolean(v))}
              />
              <label htmlFor="disclaimer" className="text-sm">
                I acknowledge the disclaimer and want to continue.
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={onContinueExploring}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Continue exploring
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Prefer accountable access? Switch to the “Create account” tab.
          </p>
        </TabsContent>

        {/* Accountable */}
        <TabsContent value="accountable" className="mt-4 space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Create an account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Unlock saved parcels, share links, and branded reports with an audit trail.
                </p>
              </div>
              <Badge>Recommended</Badge>
            </div>

            <Separator className="my-4" />

            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span>Save parcels</span>
                <Badge>Unlocked</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Share links</span>
                <Badge>Unlocked</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Branded reports</span>
                <Badge>Unlocked</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Workspace collaboration</span>
                <Badge>Unlocked</Badge>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Product updates</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Optional. You can change this later.
                </p>
              </div>
              <Switch
                checked={marketingOptIn}
                onCheckedChange={setMarketingOptIn}
                aria-label="Marketing opt-in"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateAccount}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Create account
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account? {" "}
            <Link href="/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </TabsContent>
      </Tabs>


      <Separator className="my-6" />

      {/* Bulk Contacts Import (CSV) */}
      <div className="my-8">
        <ContactsCsvImport onImport={handleContactsImport} />
      </div>

      <p className="text-xs text-muted-foreground">
        This screen is a gating surface: Anonymous mode permits exploration, while accountable mode
        aligns to your CCP-backed audit and entitlement model.
      </p>
    </main>
  );
}
