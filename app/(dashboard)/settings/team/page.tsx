'use client';

import { useApp } from '@/lib/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Users, Mail } from 'lucide-react';

export default function TeamPage() {
  const { team, user } = useApp();

  if (!team || !user) {
    return <div>Loading...</div>;
  }

  const isTeamOwner = team.teamMembers?.[0]?.userId === user.id;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Team Information</h2>
        <p className="mt-1 text-sm text-gray-600">Manage your team settings and members.</p>
      </div>

      {/* Team Details */}
      <Card className="p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Team Details</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="text-gray-700">Team Name</Label>
            <p className="mt-2 text-gray-900 font-medium">{team.name}</p>
          </div>
          <div>
            <Label className="text-gray-700">Slug</Label>
            <p className="mt-2 text-gray-900 font-medium">{team.slug}</p>
          </div>
        </div>
      </Card>

      {/* Team Members */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </h3>
          {isTeamOwner && (
            <Button size="sm" variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {team.teamMembers && team.teamMembers.length > 0 ? (
            <div className="divide-y">
              {team.teamMembers.map((member) => (
                <div key={member.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{member.user?.name || member.user?.email}</p>
                    <p className="text-sm text-gray-600">{member.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                      {member.role || 'Member'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No team members yet</p>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 bg-red-50">
        <h3 className="text-md font-semibold text-red-900 mb-4">Danger Zone</h3>
        <p className="text-sm text-red-700 mb-4">
          Deleting your team is permanent and cannot be undone.
        </p>
        <Button variant="destructive" disabled={!isTeamOwner}>
          Delete Team
        </Button>
      </Card>
    </div>
  );
}
