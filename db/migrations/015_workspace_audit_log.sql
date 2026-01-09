-- Migration: Create workspace_audit_log table
-- Purpose: Immutable append-only audit trail for all workspace-level changes
-- Tracks: workspace updates, member changes, entitlements, billing events
-- CCP-07 (Audit Logging) + CCP-05 (Entitlements)

-- Create workspace_audit_log table
create table if not exists public.workspace_audit_log (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id text not null, -- user_id or 'system' for automated events
  action text not null check (action in (
    'workspace.created',
    'workspace.updated',
    'workspace.deleted',
    'workspace.member_added',
    'workspace.member_removed',
    'workspace.member_role_changed',
    'workspace.plan_upgraded',
    'workspace.plan_downgraded',
    'workspace.entitlement_granted',
    'workspace.entitlement_denied',
    'workspace.entitlement_revoked',
    'workspace.billing_sync',
    'workspace.settings_updated'
  )),
  resource_type text not null check (resource_type in ('workspace', 'member', 'entitlement', 'billing')),
  resource_id text, -- references resource being modified
  old_values jsonb, -- previous state
  new_values jsonb, -- new state
  changed_fields text[], -- which fields changed
  reason text, -- why the change occurred (e.g., denial reason)
  metadata jsonb default '{}'::jsonb, -- additional context (ip, user_agent, etc.)
  status text not null default 'success' check (status in ('success', 'denied', 'failed')),
  created_at timestamp with time zone not null default now()
);

-- Create indexes for efficient querying
create index if not exists workspace_audit_log_workspace_id_idx on public.workspace_audit_log(workspace_id);
create index if not exists workspace_audit_log_actor_id_idx on public.workspace_audit_log(actor_id);
create index if not exists workspace_audit_log_action_idx on public.workspace_audit_log(action);
create index if not exists workspace_audit_log_created_at_idx on public.workspace_audit_log(created_at);
create index if not exists workspace_audit_log_workspace_created_idx on public.workspace_audit_log(workspace_id, created_at DESC);
create index if not exists workspace_audit_log_resource_idx on public.workspace_audit_log(resource_type, resource_id);
create index if not exists workspace_audit_log_status_idx on public.workspace_audit_log(status);

-- Enable Row Level Security
alter table public.workspace_audit_log enable row level security;

-- RLS Policy: Users can view audit logs for workspaces they're members of
create policy "Users can view workspace audit logs for their workspaces" on public.workspace_audit_log
  for select
  using (
    workspace_id in (
      select workspace_id from public.users_workspaces where user_id = auth.uid()
    )
  );

-- RLS Policy: Only system can insert (via service role)
create policy "System inserts audit logs" on public.workspace_audit_log
  for insert
  with check (true);

-- RLS Policy: Audit logs are immutable (no updates or deletes from user context)
create policy "Audit logs are immutable" on public.workspace_audit_log
  for update
  using (false);

create policy "Audit logs cannot be deleted" on public.workspace_audit_log
  for delete
  using (false);

-- Create view for audit summary by workspace
create or replace view public.workspace_audit_summary as
  select
    workspace_id,
    count(*) as total_events,
    count(case when status = 'success' then 1 end) as successful_events,
    count(case when status = 'denied' then 1 end) as denied_events,
    count(case when status = 'failed' then 1 end) as failed_events,
    count(distinct actor_id) as unique_actors,
    count(distinct action) as action_types,
    min(created_at) as first_event,
    max(created_at) as last_event,
    json_object_agg(action, count(*)) as actions_breakdown
  from public.workspace_audit_log
  group by workspace_id;

-- Create view for recent workspace changes
create or replace view public.workspace_recent_changes as
  select
    workspace_id,
    id,
    actor_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    changed_fields,
    reason,
    status,
    created_at,
    row_number() over (partition by workspace_id order by created_at desc) as rn
  from public.workspace_audit_log
  where created_at > now() - interval '90 days';

-- Create trigger to audit workspace table updates
create or replace function public.audit_workspace_update()
returns trigger as $$
begin
  insert into public.workspace_audit_log (
    id,
    workspace_id,
    actor_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    changed_fields,
    metadata,
    status
  ) values (
    'audit_' || extract(epoch from now())::int || '_' || floor(random() * 1000000)::int,
    new.id,
    coalesce(current_setting('app.current_user_id', true), 'system'),
    'workspace.updated',
    'workspace',
    new.id::text,
    row_to_json(old),
    row_to_json(new),
    array_agg(key) filter (where old is distinct from new),
    jsonb_build_object('trigger', 'workspace_update'),
    'success'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to workspace table
drop trigger if exists workspace_audit_trigger on public.workspaces;
create trigger workspace_audit_trigger
  after update on public.workspaces
  for each row
  when (old is distinct from new)
  execute function public.audit_workspace_update();

-- Retention policy: Keep audit logs for 2 years
create or replace function public.cleanup_old_audit_logs()
returns void as $$
begin
  delete from public.workspace_audit_log
  where created_at < now() - interval '2 years';
end;
$$ language plpgsql security definer;

-- Grant permissions
grant select on public.workspace_audit_log to anon, authenticated;
grant select on public.workspace_audit_summary to anon, authenticated;
grant select on public.workspace_recent_changes to anon, authenticated;
