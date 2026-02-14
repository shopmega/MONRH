-- Align app data with Supabase Auth identities.
-- Note: rows linked to non-existent users are removed before FK enforcement.

create extension if not exists "pgcrypto";

-- Keep only rows tied to an existing auth user before adding FK constraints.
do $$
begin
  if to_regclass('public.user_simulations') is not null then
    delete from public.user_simulations s
    where not exists (select 1 from auth.users u where u.id = s.user_id);
  end if;

  if to_regclass('public.user_documents') is not null then
    delete from public.user_documents d
    where not exists (select 1 from auth.users u where u.id = d.user_id);
  end if;

  if to_regclass('public.user_violation_logs') is not null then
    delete from public.user_violation_logs v
    where not exists (select 1 from auth.users u where u.id = v.user_id);
  end if;

  if to_regclass('public.user_overtime_logs') is not null then
    delete from public.user_overtime_logs o
    where not exists (select 1 from auth.users u where u.id = o.user_id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.user_simulations') is not null and not exists (
    select 1
    from pg_constraint
    where conname = 'user_simulations_user_id_fkey'
  ) then
    alter table public.user_simulations
      add constraint user_simulations_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if to_regclass('public.user_documents') is not null and not exists (
    select 1
    from pg_constraint
    where conname = 'user_documents_user_id_fkey'
  ) then
    alter table public.user_documents
      add constraint user_documents_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if to_regclass('public.user_violation_logs') is not null and not exists (
    select 1
    from pg_constraint
    where conname = 'user_violation_logs_user_id_fkey'
  ) then
    alter table public.user_violation_logs
      add constraint user_violation_logs_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if to_regclass('public.user_overtime_logs') is not null and not exists (
    select 1
    from pg_constraint
    where conname = 'user_overtime_logs_user_id_fkey'
  ) then
    alter table public.user_overtime_logs
      add constraint user_overtime_logs_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_email on public.user_profiles (email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_set_updated_at on public.user_profiles;
create trigger trg_user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function public.sync_user_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_or_updated on auth.users;
create trigger on_auth_user_created_or_updated
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.sync_user_profile_from_auth();

-- Backfill profiles for users that already exist.
insert into public.user_profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url);

alter table public.user_profiles enable row level security;

drop policy if exists user_profiles_select_own on public.user_profiles;
create policy user_profiles_select_own
  on public.user_profiles
  for select
  using (auth.uid() = id);

drop policy if exists user_profiles_update_own on public.user_profiles;
create policy user_profiles_update_own
  on public.user_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists user_profiles_insert_own on public.user_profiles;
create policy user_profiles_insert_own
  on public.user_profiles
  for insert
  with check (auth.uid() = id);
