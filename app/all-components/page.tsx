"use client";
import React from "react";
import dynamic from "next/dynamic";

// Parcel components
import { MapView } from "@/components/parcel/MapView";
import { ParcelAccordion } from "@/components/parcel/ParcelAccordion";
import { ParcelDetailsSheet } from "@/components/parcel/ParcelDetailsSheet";
import { ParcelList } from "@/components/parcel/ParcelList";
import { ParcelSheet } from "@/components/parcel/ParcelSheet";
import { SaveReportDialog } from "@/components/parcel/SaveReportDialog";
import { SnapshotWarningDialog } from "@/components/parcel/SnapshotWarningDialog";
import { StreetViewPano } from "@/components/parcel/StreetViewPano";

// UI components
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Error boundary
import { ErrorBoundary } from "@/components/error-boundary";

const AllComponentsPage = () => (
  <div style={{ padding: 24 }}>
    <h1>All Components Playground</h1>
    <section>
      <h2>Parcel Components</h2>
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && <MapView />}
      <ParcelAccordion
        parcel={{
          id: "mock-id-1",
          address: "123 Main St",
          apn: "000-000-000",
          jurisdiction: "Mock City",
          zoning: "R1",
          notes: "Mock parcel for testing.",
          sources: ["Mock Source 1", "Mock Source 2"],
          lat: 40.0,
          lng: -105.0,
        }}
        onCreateReport={() => {}}
        onGatedAction={() => {}}
      />
      <ParcelDetailsSheet
        open={false}
        onOpenChange={() => {}}
        parcel={{
          id: "mock-id-1",
          address: "123 Main St",
          apn: "000-000-000",
          jurisdiction: "Mock City",
          zoning: "R1",
          notes: "Mock parcel for testing.",
          sources: ["Mock Source 1", "Mock Source 2"],
          lat: 40.0,
          lng: -105.0,
        }}
        onCreateReport={() => {}}
        onGatedAction={() => {}}
      />
      <ParcelList
        parcels={[
          {
            id: "mock-id-1",
            address: "123 Main St",
            apn: "000-000-000",
            jurisdiction: "Mock City",
            zoning: "R1",
            notes: "Mock parcel for testing.",
            sources: ["Mock Source 1", "Mock Source 2"],
            lat: 40.0,
            lng: -105.0,
          },
        ]}
        loading={false}
        onSelect={() => {}}
      />
      {/*
        The following components are commented out to prevent real fetches or server actions in the playground.
        Uncomment and provide mocks as needed for safe rendering.
      */}
      {/* <ParcelSheet /> */}
      {/* <SaveReportDialog open={false} onOpenChange={() => {}} /> */}
      {/* <SnapshotWarningDialog open={false} onOpenChange={() => {}} /> */}
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && <StreetViewPano />}
    </section>
    <section>
      <h2>UI Components</h2>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Accordion Item</AccordionTrigger>
          <AccordionContent>Accordion Content</AccordionContent>
        </AccordionItem>
      </Accordion>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Open Alert Dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Alert</AlertDialogTitle>
          <AlertDialogDescription>This is a test alert dialog.</AlertDialogDescription>
          <AlertDialogAction>OK</AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
      <Avatar />
      <Badge>Badge</Badge>
      <Button>Button</Button>
      <Card>Card</Card>
      <Checkbox />
      <Collapsible>
        <CollapsibleTrigger>Open</CollapsibleTrigger>
        <CollapsibleContent>Collapsible Content</CollapsibleContent>
      </Collapsible>
      <Dialog />
      <DropdownMenu />
      <Input placeholder="Input" />
      <Label>Label</Label>
      <RadioGroup />
      <ScrollArea style={{ height: 100 }}>
        <div style={{ height: 200 }}>Scrollable Content</div>
      </ScrollArea>
      <Select>
        <SelectTrigger>Open</SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
          <SelectItem value="2">Two</SelectItem>
        </SelectContent>
      </Select>
      <Separator />
      <Sheet />
      <Skeleton />
      <Switch />
      <Tabs>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Tab 1 Content</TabsContent>
        <TabsContent value="tab2">Tab 2 Content</TabsContent>
      </Tabs>
      <Textarea placeholder="Textarea" />
    </section>
    <section>
      <h2>Error Boundary</h2>
      <ErrorBoundary>
        <div>Test Error Boundary</div>
      </ErrorBoundary>
    </section>
  </div>
);

export default AllComponentsPage;
