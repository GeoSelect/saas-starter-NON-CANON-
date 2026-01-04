'use client';

import { useActionState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from './actions';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useApp();
  const [state, formAction, pending] = useActionState(updateProfile, { error: '' });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
        <p className="mt-1 text-sm text-gray-600">Update your name and email address.</p>
      </div>

      <form action={formAction} className="space-y-6">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name || ''}
            placeholder="Enter your full name"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email}
            disabled
            className="mt-2 bg-gray-50"
          />
          <p className="mt-2 text-xs text-gray-500">Email cannot be changed currently</p>
        </div>

        {state?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Profile updated successfully
          </div>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>
    </div>
  );
}
