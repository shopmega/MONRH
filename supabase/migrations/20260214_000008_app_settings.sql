-- Generic application settings storage.
-- Used for dynamic website/admin configuration in production/serverless environments.

create table if not exists public.app_settings (
  name text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_app_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_settings_set_updated_at on public.app_settings;
create trigger trg_app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_app_settings_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists app_settings_select_none on public.app_settings;
create policy app_settings_select_none
  on public.app_settings
  for select
  using (false);

drop policy if exists app_settings_insert_none on public.app_settings;
create policy app_settings_insert_none
  on public.app_settings
  for insert
  with check (false);

drop policy if exists app_settings_update_none on public.app_settings;
create policy app_settings_update_none
  on public.app_settings
  for update
  using (false)
  with check (false);

drop policy if exists app_settings_delete_none on public.app_settings;
create policy app_settings_delete_none
  on public.app_settings
  for delete
  using (false);
