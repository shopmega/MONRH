-- Align generated_contracts with the API code that already writes user_id.

alter table public.generated_contracts
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_generated_contracts_user_created
  on public.generated_contracts (user_id, created_at desc);

drop policy if exists generated_contracts_insert_user on public.generated_contracts;
create policy generated_contracts_insert_user
  on public.generated_contracts
  for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists generated_contracts_select_user on public.generated_contracts;
create policy generated_contracts_select_user
  on public.generated_contracts
  for select
  using (auth.uid() = user_id);
