"use client";

import { AlertTriangle, Binoculars, CheckCircle, Info, Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ContinuationChoicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6 sm:max-w-lg">
        <header className="space-y-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
            Step 12 • Continue or create
          </Badge>
          <h1 className="text-2xl font-semibold text-foreground">What do you want to do next?</h1>
          <p className="text-sm text-muted-foreground">
            Choose how you continue. Your choice changes what gets saved and what stays transient.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-900 shadow-sm">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">Only saved work can be relied on later.</p>
          </div>
        </header>

        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-center gap-2 text-primary">
              <Lock className="h-5 w-5" aria-hidden />
              <CardTitle className="text-lg">Create Your Workspace</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Build a persistent workspace for all your reports, snapshots, and analysis.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="h-12 w-full" onClick={() => router.push("/sign-up")}>
              Create Workspace Account
            </Button>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="save-details">
                <AccordionTrigger className="text-sm font-medium">
                  What this means
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">Reports, snapshots, accountability</p>
                      <p>We record decisions with source tags for later review.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">Decision record</p>
                      <p>Creates a verifiable trail with timestamps and provenance.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-blue-600" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">Next unlock</p>
                      <p>Snapshotting, sharing modes, and gated sections become available.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Separator className="my-2" />

        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-center gap-2 text-foreground">
              <Binoculars className="h-5 w-5" aria-hidden />
              <CardTitle className="text-lg">Continue exploring</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Stay in read-only mode. Nothing is saved, and no decision record is created.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="secondary"
              className="h-12 w-full"
              onClick={() => router.push("/parcel/resolve")}
            >
              Continue exploring
            </Button>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="explore-details">
                <AccordionTrigger className="text-sm font-medium">
                  What this means
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-blue-600" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">Context only</p>
                      <p>View data without storing decisions or snapshots.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">No audit trail</p>
                      <p>Exploration is transient—cannot be relied on later.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">Low-commitment</p>
                      <p>Switch to saving anytime; you won’t lose your place.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="space-y-2 rounded-xl border border-dashed border-foreground/10 bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" aria-hidden />
            <p>Tip: Tapping either option previews what unlocks next without hard-stopping your flow.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
