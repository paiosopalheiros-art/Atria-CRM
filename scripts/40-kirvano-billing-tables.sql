-- Criar tabelas para sistema de billing Kirvano
create table if not exists public.billing_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id text primary key,
  customer_email text,
  product_id text,
  offer_id text,
  amount_cents integer,
  currency text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  kirvano_subscription_id text primary key,
  customer_email text,
  plan text not null,                   -- 'pro' | 'elite'
  status text not null,                 -- 'active' | 'canceled'
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

-- Adicionar colunas de plano ao user_profiles se não existirem
alter table public.user_profiles 
add column if not exists plan text default 'free',
add column if not exists plan_renews_at timestamptz;

-- Índices para performance
create index if not exists idx_billing_events_type on public.billing_events(type);
create index if not exists idx_payments_email on public.payments(customer_email);
create index if not exists idx_subscriptions_email on public.subscriptions(customer_email);
create index if not exists idx_user_profiles_email on public.user_profiles(email);

-- RLS policies
alter table public.billing_events enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;

-- Políticas para admins apenas (billing é sensível)
create policy "Admin access billing_events" on public.billing_events
  for all using (auth.jwt() ->> 'role' = 'service_role');

create policy "Admin access payments" on public.payments
  for all using (auth.jwt() ->> 'role' = 'service_role');

create policy "Admin access subscriptions" on public.subscriptions
  for all using (auth.jwt() ->> 'role' = 'service_role');
