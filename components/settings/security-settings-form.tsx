"use client";
import React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/app/(dashboard)/settings/actions";
import { Loader2 } from "lucide-react";

export function SecuritySettingsForm() {
  const [state, formAction, pending] = useActionState(updatePassword, { error: "" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Security</h2>
        <p className="mt-1 text-sm text-gray-600">Manage your password and security settings.</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          Keep your account secure by using a strong, unique password.
        </p>
      </div>
      <form action={formAction} className="space-y-6">
        <div>
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input id="currentPassword" name="currentPassword" type="password" placeholder="Enter your current password" className="mt-2" required />
        </div>
        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <Input id="newPassword" name="newPassword" type="password" placeholder="Enter your new password" className="mt-2" required />
          <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm your new password" className="mt-2" required />
        </div>
        {state?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.error}</div>
        )}
        {state?.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{state.success}</div>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>) : ("Update Password")}
        </Button>
      </form>
    </div>
  );
}
