'use client';

import { useEffect, useState } from 'react';
import {
  getWorkspaceMembers,
  inviteUserToWorkspace,
  updateUserRole,
  removeUserFromWorkspace,
} from '@/lib/workspace-client';
import { UserWorkspace } from '@/lib/types/workspace';
import { Shield, Trash2, Mail, Plus } from 'lucide-react';

interface MembersManagerProps {
  workspace_id: string;
  is_owner: boolean;
}

export function MembersManager({ workspace_id, is_owner }: MembersManagerProps) {
  const [members, setMembers] = useState<(UserWorkspace & { email?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [workspace_id]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceMembers(workspace_id);
      setMembers(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      const newMember = await inviteUserToWorkspace(
        workspace_id,
        inviteEmail,
        inviteRole
      );
      if (newMember) {
        setMembers([...members, newMember]);
        setInviteEmail('');
        setInviteRole('member');
      }
    } catch (err) {
      console.error('Error inviting user:', err);
      setError('Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (user_id: string, newRole: 'member' | 'admin' | 'viewer') => {
    try {
      const updated = await updateUserRole(workspace_id, user_id, newRole);
      if (updated) {
        setMembers(
          members.map(m => (m.user_id === user_id ? { ...m, role: newRole } : m))
        );
      }
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const handleRemove = async (user_id: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const success = await removeUserFromWorkspace(workspace_id, user_id);
      if (success) {
        setMembers(members.filter(m => m.user_id !== user_id));
      }
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {is_owner && (
        <form onSubmit={handleInvite} className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Invite
            </button>
          </div>
        </form>
      )}

      {members.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No members yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>
                {is_owner && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
                        {(member.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.email || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {is_owner && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={e =>
                          handleRoleChange(member.user_id, e.target.value as any)
                        }
                        className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 gap-1">
                        {member.role === 'owner' && <Shield className="h-3 w-3" />}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  {is_owner && (
                    <td className="px-6 py-4">
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(member.user_id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
