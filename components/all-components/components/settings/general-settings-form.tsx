"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Pass data via props so the component doesn't need to fetch it internally
interface GeneralSettingsFormProps {
  initialData?: {
    name: string;
    email: string;
  };
}

export function GeneralSettingsForm({ initialData }: GeneralSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input id="name" defaultValue={initialData?.name || "User"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" defaultValue={initialData?.email || "user@example.com"} />
        </div>
        <Button className="w-full">Save Changes</Button>
      </CardContent>
    </Card>
  );
}
