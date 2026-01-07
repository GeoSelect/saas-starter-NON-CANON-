'use client';

import * as React from 'react';
import { Eye, MessageSquare, Download, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';

interface Role {
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
}

interface RoleSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const ROLE_CONFIGS: Role[] = [
  {
    name: 'viewer',
    display_name: 'Viewer',
    description: 'Can view the report only',
    permissions: ['View report', 'See all sources and rules'],
  },
  {
    name: 'commenter',
    display_name: 'Commenter',
    description: 'Can view and add comments',
    permissions: ['View report', 'Add comments', 'Discuss findings'],
  },
  {
    name: 'editor',
    display_name: 'Editor',
    description: 'Can view, comment, and download',
    permissions: ['View report', 'Add comments', 'Download data', 'Export to PDF'],
  },
];

export function RoleSelector({ value, onValueChange, disabled }: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Access Level</Label>
      <RadioGroup value={value} onValueChange={onValueChange} disabled={disabled}>
        {ROLE_CONFIGS.map((role) => (
          <Card
            key={role.name}
            className={`relative p-4 cursor-pointer transition-colors ${
              value === role.name ? 'border-primary bg-accent' : 'hover:bg-accent/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onValueChange(role.name)}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value={role.name} id={role.name} className="mt-1" />
              <div className="flex-1">
                <label htmlFor={role.name} className="font-medium cursor-pointer">
                  {role.display_name}
                </label>
                <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                <ul className="mt-2 space-y-1">
                  {role.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-green-600" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
              {role.name === 'viewer' && <Eye className="h-5 w-5 text-muted-foreground" />}
              {role.name === 'commenter' && <MessageSquare className="h-5 w-5 text-muted-foreground" />}
              {role.name === 'editor' && <Download className="h-5 w-5 text-muted-foreground" />}
            </div>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
}
