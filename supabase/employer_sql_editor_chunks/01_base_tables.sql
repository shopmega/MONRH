create extension if not exists "pgcrypto";

create table if not exists public.employer_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (plan in ('free', 'pro', 'cabinet')),
  check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete'))
);

create unique index if not exists idx_employer_subscriptions_stripe_customer
  on public.employer_subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists idx_employer_subscriptions_stripe_subscription
  on public.employer_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.user_employer_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_key text not null default 'default',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workspace_key)
);

create index if not exists idx_user_employer_workspaces_user_updated
  on public.user_employer_workspaces (user_id, updated_at desc);
