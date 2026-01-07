"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function GeneralSettingsForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input id="name" placeholder="User Name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" placeholder="user@example.com" />
        </div>
        <Button className="w-full">Save Changes</Button>
      </CardContent>
    </Card>
  );
}
