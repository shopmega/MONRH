-- Content tables for articles and document templates.
-- Replaces filesystem-backed content stores with Supabase-backed persistence.

create extension if not exists "pgcrypto";

create table if not exists public.articles (
  slug text primary key,
  title text not null,
  excerpt text not null,
  category_slug text not null,
  reading_time text not null,
  last_updated date not null default current_date,
  content_blocks jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  access text not null default 'public',
  thumbnail_url text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (access in ('public', 'logged'))
);

create index if not exists idx_articles_active_access on public.articles (is_active, access);
create index if not exists idx_articles_category on public.articles (category_slug);
create index if not exists idx_articles_last_updated on public.articles (last_updated desc);

create table if not exists public.document_templates (
  id text primary key,
  title text not null,
  description text not null,
  fields jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_templates_active on public.document_templates (is_active);

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_articles_set_updated_at on public.articles;
create trigger trg_articles_set_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

drop trigger if exists trg_document_templates_set_updated_at on public.document_templates;
create trigger trg_document_templates_set_updated_at
before update on public.document_templates
for each row execute function public.set_updated_at();

alter table public.articles enable row level security;
alter table public.document_templates enable row level security;

-- Public read for active content.
drop policy if exists articles_select_public on public.articles;
create policy articles_select_public
  on public.articles
  for select
  using (is_active = true and access = 'public');

drop policy if exists document_templates_select_public on public.document_templates;
create policy document_templates_select_public
  on public.document_templates
  for select
  using (is_active = true);

-- Content mutations are service-role/admin only (no direct client-side RLS writes).
drop policy if exists articles_insert_none on public.articles;
create policy articles_insert_none
  on public.articles
  for insert
  with check (false);

drop policy if exists articles_update_none on public.articles;
create policy articles_update_none
  on public.articles
  for update
  using (false)
  with check (false);

drop policy if exists articles_delete_none on public.articles;
create policy articles_delete_none
  on public.articles
  for delete
  using (false);

drop policy if exists document_templates_insert_none on public.document_templates;
create policy document_templates_insert_none
  on public.document_templates
  for insert
  with check (false);

drop policy if exists document_templates_update_none on public.document_templates;
create policy document_templates_update_none
  on public.document_templates
  for update
  using (false)
  with check (false);

drop policy if exists document_templates_delete_none on public.document_templates;
create policy document_templates_delete_none
  on public.document_templates
  for delete
  using (false);
