"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updatePassword } from "../../app/(dashboard)/settings/actions";

export function SecuritySettingsForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>
        <Button className="w-full">Update Password</Button>
      </CardContent>
    </Card>
  );
}