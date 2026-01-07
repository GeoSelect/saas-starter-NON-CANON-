'use client';

import * as React from 'react';
import { Eye, MessageSquare, Download, MoreHorizontal, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

interface Association {
  id: string;
  recipient_email?: string;
  assigned_role_id: string;
  roles: {
    name: string;
    display_name: string;
  };
  relationship_status: string;
  created_at: string;
  share_reason?: string;
}

interface AssociationsListProps {
  workspaceId: string;
}

export function AssociationsList({ workspaceId }: AssociationsListProps) {
  const [associations, setAssociations] = React.useState<Association[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('active');

  React.useEffect(() => {
    fetchAssociations();
  }, [workspaceId, statusFilter]);

  async function fetchAssociations() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/associations?status=${statusFilter}`
      );
      const data = await res.json();
      setAssociations(data.associations || []);
    } catch (error) {
      console.error('Failed to fetch associations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeRole(associationId: string, newRoleName: string) {
    try {
      const res = await fetch(`/api/event-associations/${associationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_role_name: newRoleName }),
      });

      if (!res.ok) throw new Error('Failed to change role');

      toast({ title: 'Role updated' });
      fetchAssociations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function handleRevoke(associationId: string) {
    try {
      const res = await fetch(`/api/event-associations/${associationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to revoke');

      toast({ title: 'Access revoked' });
      fetchAssociations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  function getRoleIcon(roleName: string) {
    switch (roleName) {
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      case 'commenter':
        return <MessageSquare className="h-4 w-4" />;
      case 'editor':
        return <Download className="h-4 w-4" />;
      default:
        return null;
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Share Associations</CardTitle>
            <CardDescription>Manage who has access to your reports</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : associations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No associations found
          </div>
        ) : (
          <div className="space-y-4">
            {associations.map((assoc) => (
              <div
                key={assoc.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {assoc.recipient_email || 'Unknown recipient'}
                    </span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getRoleIcon(assoc.roles.name)}
                      {assoc.roles.display_name}
                    </Badge>
                    {assoc.relationship_status !== 'active' && (
                      <Badge variant="secondary">{assoc.relationship_status}</Badge>
                    )}
                  </div>
                  {assoc.share_reason && (
                    <p className="text-sm text-muted-foreground">{assoc.share_reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Shared {new Date(assoc.created_at).toLocaleDateString()}
                  </p>
                </div>

                {assoc.relationship_status === 'active' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleChangeRole(assoc.id, 'viewer')}
                      >
                        Change to Viewer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleChangeRole(assoc.id, 'commenter')}
                      >
                        Change to Commenter
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleChangeRole(assoc.id, 'editor')}
                      >
                        Change to Editor
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRevoke(assoc.id)}
                        className="text-destructive"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Revoke Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
