-- CCP-02 Parcel Snapshots - Immutable evidence capture
-- Freezes parcel context at a point in time with audit trail

create table if not exists parcel_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Parcel context frozen at capture time
  parcel_id text not null,
  parcel_address text not null,
  parcel_jurisdiction text,
  parcel_zoning text,
  parcel_apn text,
  parcel_geometry jsonb, -- GeoJSON
  parcel_sources text[] default '{}',
  
  -- Evidence and context
  summary_text text, -- User's notes about this parcel
  constraints jsonb default '{}', -- Rules/restrictions applicable
  sources jsonb default '{}', -- Citations and references
  metadata jsonb default '{}', -- Additional context
  
  -- Governance
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz, -- Optional: archive old snapshots
  archived_at timestamptz,
  
  constraint workspace_user_fk foreign key (workspace_id, user_id) 
    references workspace_members(workspace_id, user_id) on delete cascade
);

create index if not exists parcel_snapshots_workspace_id_idx on parcel_snapshots(workspace_id);
create index if not exists parcel_snapshots_user_id_idx on parcel_snapshots(user_id);
create index if not exists parcel_snapshots_created_at_idx on parcel_snapshots(created_at desc);
create index if not exists parcel_snapshots_archived_at_idx on parcel_snapshots(archived_at) where archived_at is null;

-- Enable RLS
alter table parcel_snapshots enable row level security;

-- User can view their own snapshots in their workspaces
create policy "Users can view their own workspace snapshots" on parcel_snapshots
  for select using (
    auth.uid() = user_id and 
    exists(
      select 1 from workspace_members 
      where workspace_members.workspace_id = parcel_snapshots.workspace_id 
        and workspace_members.user_id = auth.uid()
    )
  );

-- User can create snapshots in their workspaces
create policy "Users can create snapshots in their workspaces" on parcel_snapshots
  for insert with check (
    auth.uid() = user_id and 
    exists(
      select 1 from workspace_members 
      where workspace_members.workspace_id = parcel_snapshots.workspace_id 
        and workspace_members.user_id = auth.uid()
    )
  );

-- User can update their own snapshots
create policy "Users can update their own snapshots" on parcel_snapshots
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- User can soft-delete (archive) their own snapshots
create policy "Users can archive their own snapshots" on parcel_snapshots
  for delete using (auth.uid() = user_id);

-- Junction: share_links can reference parcel_snapshots
alter table share_links add column if not exists parcel_snapshot_id uuid references parcel_snapshots(id) on delete cascade;
create index if not exists share_links_parcel_snapshot_id_idx on share_links(parcel_snapshot_id);
