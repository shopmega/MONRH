-- Server-owned employer subscription authority.
-- Stripe/webhook integration should upsert this table; employer company payloads must not unlock gated features.

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

alter table public.employer_subscriptions enable row level security;

drop policy if exists employer_subscriptions_select_own on public.employer_subscriptions;
create policy employer_subscriptions_select_own
  on public.employer_subscriptions
  for select
  using (auth.uid() = user_id);

drop trigger if exists trg_employer_subscriptions_set_updated_at on public.employer_subscriptions;
create trigger trg_employer_subscriptions_set_updated_at
before update on public.employer_subscriptions
for each row execute function public.set_updated_at();
