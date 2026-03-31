-- Table-driven admin access control.
-- Manage admin users directly in Supabase by inserting/updating rows.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role in ('admin'))
);

create index if not exists idx_admin_users_enabled on public.admin_users (enabled);

create or replace function public.set_admin_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_users_set_updated_at on public.admin_users;
create trigger trg_admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_admin_users_updated_at();

alter table public.admin_users enable row level security;

drop policy if exists admin_users_select_none on public.admin_users;
create policy admin_users_select_none
  on public.admin_users
  for select
  using (false);

drop policy if exists admin_users_insert_none on public.admin_users;
create policy admin_users_insert_none
  on public.admin_users
  for insert
  with check (false);

drop policy if exists admin_users_update_none on public.admin_users;
create policy admin_users_update_none
  on public.admin_users
  for update
  using (false)
  with check (false);

drop policy if exists admin_users_delete_none on public.admin_users;
create policy admin_users_delete_none
  on public.admin_users
  for delete
  using (false);
