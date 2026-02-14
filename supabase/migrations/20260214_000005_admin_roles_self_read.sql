-- Allow logged-in users to read only their own admin role row.
-- This enables server checks with user session context (without service-role dependency).

alter table public.admin_users enable row level security;

drop policy if exists admin_users_select_none on public.admin_users;
create policy admin_users_select_own
  on public.admin_users
  for select
  using (auth.uid() = user_id);

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
