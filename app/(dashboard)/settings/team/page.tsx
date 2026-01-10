'use client';

import { useApp } from '@/lib/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Mail, Trash2, RotateCw, Send, Clock, CheckCircle, XCircle, AlertCircle, Crown, Shield, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface Member {
  id: string;
  role: string;
  created_at: string;
  users: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function TeamPage() {
  const { team, user } = useApp();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [entitlementInfo, setEntitlementInfo] = useState<{ currentCount: number; limit: number } | null>(null);

  const isTeamOwner = team?.teamMembers?.[0]?.userId === user?.id;

  useEffect(() => {
    if (team?.id) {
      fetchMembers();
      fetchInvites();
    }
  }, [team?.id]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/team/members?workspaceId=${team?.id}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await fetch(`/api/team/invites?workspaceId=${team?.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !team?.id) return;

    setLoading(true);
    try {
      const response = await fetch('/api/team/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          workspaceId: team.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'ENTITLEMENT_LIMIT_REACHED') {
          setEntitlementInfo({
            currentCount: data.currentCount,
            limit: data.limit,
          });
        }
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast.success('Invitation sent successfully!');
      setInviteEmail('');
      setInviteRole('member');
      setIsInviteDialogOpen(false);
      fetchInvites();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/team/invites/${inviteId}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend invitation');
      }

      toast.success('Invitation resent successfully!');
      fetchInvites();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/team/invites/${inviteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      toast.success('Invitation cancelled successfully!');
      fetchInvites();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      toast.success('Member removed successfully!');
      fetchMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  if (!team || !user) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const pendingInvites = invites.filter(inv => inv.status === 'pending');
  const totalMembers = members.length + pendingInvites.length;

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
            <Label className="text-gray-700">Team Size</Label>
            <p className="mt-2 text-gray-900 font-medium">
              {members.length} {members.length === 1 ? 'member' : 'members'}
              {pendingInvites.length > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  (+{pendingInvites.length} pending)
                </span>
              )}
            </p>
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
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a new team member. They will receive an email with a link to join.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {entitlementInfo && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        You've reached your team limit ({entitlementInfo.currentCount}/{entitlementInfo.limit} members). Please upgrade your plan to add more members.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={loading || !inviteEmail}>
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-4">
          {members.length > 0 ? (
            <div className="divide-y">
              {members.map((member) => (
                <div key={member.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {(member.users.full_name || member.users.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.users.full_name || member.users.email}
                      </p>
                      <p className="text-sm text-gray-600">{member.users.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getRoleBadgeClass(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    {isTeamOwner && member.role !== 'owner' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {member.users.full_name || member.users.email} from the team? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove Member
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm text-center py-8">No team members yet</p>
          )}
        </div>
      </Card>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Invitations
            </h3>
            <span className="text-sm text-gray-600">{pendingInvites.length} pending</span>
          </div>

          <div className="space-y-4">
            <div className="divide-y">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      <p className="text-sm text-gray-600">
                        Invited {new Date(invite.created_at).toLocaleDateString()} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getRoleBadgeClass(invite.role)}`}>
                      {getRoleIcon(invite.role)}
                      {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                    </span>
                    {isTeamOwner && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvite(invite.id)}
                          disabled={loading}
                        >
                          <RotateCw className="h-4 w-4 mr-1" />
                          Resend
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel the invitation to {invite.email}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelInvite(invite.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Yes, Cancel Invitation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
