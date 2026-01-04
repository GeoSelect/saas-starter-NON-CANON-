'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  contact_type: string;
  verification_status: string;
}

interface ContactSelectorProps {
  workspaceId: string;
  value?: string;
  onValueChange: (contactId: string) => void;
  placeholder?: string;
  className?: string;
}

export function ContactSelector({
  workspaceId,
  value,
  onValueChange,
  placeholder = 'Select recipient...',
  className,
}: ContactSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Fetch shareable contacts
  React.useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/contacts/shareable`
        );
        const data = await res.json();
        setContacts(data.contacts || []);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      fetchContacts();
    }
  }, [workspaceId, open]);

  // Debounced search
  React.useEffect(() => {
    if (!search) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/contacts/${workspaceId}?query=${encodeURIComponent(search)}&verification=verified&membership=active`
        );
        const data = await res.json();
        setContacts(data.contacts || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, workspaceId]);

  const selectedContact = contacts.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedContact ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedContact.avatar_url} />
                <AvatarFallback>
                  {selectedContact.first_name[0]}
                  {selectedContact.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <span>
                {selectedContact.first_name} {selectedContact.last_name}
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search contacts..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : contacts.length === 0 ? (
              <CommandEmpty>No contacts found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {contacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={contact.id}
                    onSelect={(currentValue) => {
                      onValueChange(
                        currentValue === value ? '' : currentValue
                      );
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.avatar_url} />
                        <AvatarFallback>
                          {contact.first_name[0]}
                          {contact.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </span>
                          {contact.contact_type === 'hoa_member' && (
                            <Badge variant="secondary" className="text-xs">
                              HOA Member
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {contact.email}
                        </span>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        value === contact.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
