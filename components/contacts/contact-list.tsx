'use client';

import * as React from 'react';
import { Mail, Phone, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  contact_type: string;
  verification_status: string;
  membership_status?: string;
}

interface ContactListProps {
  workspaceId: string;
  onSelectContact?: (contactId: string) => void;
}

export function ContactList({
  workspaceId,
  onSelectContact,
}: ContactListProps) {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  React.useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('query', search);
        if (typeFilter !== 'all') params.set('type', typeFilter);

        const res = await fetch(
          `/api/workspaces/${workspaceId}/contacts?${params}`
        );
        const data = await res.json();
        setContacts(data.contacts || []);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [workspaceId, search, typeFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
        <CardDescription>
          Manage workspace contacts and HOA members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="hoa_member">HOA Members</SelectItem>
              <SelectItem value="homeowner">Homeowners</SelectItem>
              <SelectItem value="external">External</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No contacts found
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => onSelectContact?.(contact.id)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.avatar_url} />
                  <AvatarFallback>
                    {contact.first_name[0]}
                    {contact.last_name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">
                      {contact.first_name} {contact.last_name}
                    </h4>
                    {contact.verification_status === 'verified' && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                    {contact.contact_type === 'hoa_member' && (
                      <Badge variant="outline" className="text-xs">
                        HOA
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
