begin;

create table if not exists public.moderation_queues (
  id uuid primary key default gen_random_uuid(),
  source_app text not null default 'monrh' check (source_app in ('avisine', 'monrh')),
  entity_type text not null,
  entity_id text not null,
  company_id text,
  business_id text,
  user_id uuid,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'dismissed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  queue_reason text,
  latest_action text,
  assigned_admin_id uuid references auth.users(id) on delete set null,
  created_by_admin_id uuid references auth.users(id) on delete set null,
  resolved_by_admin_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  opened_at timestamptz not null default timezone('utc'::text, now()),
  due_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  resolved_at timestamptz
);

create unique index if not exists idx_moderation_queues_entity
  on public.moderation_queues (source_app, entity_type, entity_id);

create index if not exists idx_moderation_queues_status_priority
  on public.moderation_queues (status, priority, created_at desc);

create index if not exists idx_moderation_queues_company
  on public.moderation_queues (company_id, created_at desc);

create index if not exists idx_moderation_queues_assignee
  on public.moderation_queues (assigned_admin_id, status, created_at desc);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  source_app text not null default 'monrh' check (source_app in ('avisine', 'monrh')),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'admin' check (actor_type in ('admin', 'system', 'user')),
  action text not null,
  entity_type text not null,
  entity_id text,
  queue_id uuid references public.moderation_queues(id) on delete set null,
  company_id text,
  business_id text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_audit_events_entity
  on public.audit_events (entity_type, entity_id, created_at desc);

create index if not exists idx_audit_events_queue
  on public.audit_events (queue_id, created_at desc);

create index if not exists idx_audit_events_actor
  on public.audit_events (actor_user_id, created_at desc);

create index if not exists idx_audit_events_company
  on public.audit_events (company_id, created_at desc);

alter table public.moderation_queues enable row level security;
alter table public.audit_events enable row level security;

do $$ begin
  create policy "Admins can manage moderation queues"
    on public.moderation_queues for all
    using (
      exists (
        select 1
        from public.admin_users au
        where au.user_id = auth.uid()
          and au.enabled = true
          and au.role = 'admin'
      )
    )
    with check (
      exists (
        select 1
        from public.admin_users au
        where au.user_id = auth.uid()
          and au.enabled = true
          and au.role = 'admin'
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Service role can manage moderation queues"
    on public.moderation_queues for all to service_role
    using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage audit events"
    on public.audit_events for all
    using (
      exists (
        select 1
        from public.admin_users au
        where au.user_id = auth.uid()
          and au.enabled = true
          and au.role = 'admin'
      )
    )
    with check (
      exists (
        select 1
        from public.admin_users au
        where au.user_id = auth.uid()
          and au.enabled = true
          and au.role = 'admin'
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Service role can manage audit events"
    on public.audit_events for all to service_role
    using (true) with check (true);
exception when duplicate_object then null; end $$;

comment on table public.moderation_queues is 'Shared moderation queue for MONRH evidence, verification, and future shared-core moderation workflows.';
comment on table public.audit_events is 'Unified audit event stream for MONRH moderation and admin actions.';

commit;
