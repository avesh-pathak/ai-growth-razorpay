-- Migration 003: Commerce tables (orders, payments, idempotency, agent keys, processed events)

create table if not exists orders (
  id text primary key,
  buyer_id uuid references auth.users(id),
  status text not null default 'created',  -- created, quoted, checkout, paid, captured, failed, refunded
  total_paise integer not null default 0,
  razorpay_order_id text,
  quote_ref text,
  mandate_id text references mandates(id),
  receipt_id text references receipts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_buyer_id on orders(buyer_id);
create index idx_orders_status on orders(status);
create index idx_orders_razorpay on orders(razorpay_order_id);

create table if not exists payments (
  id text primary key,
  order_id text not null references orders(id),
  razorpay_payment_id text,
  amount_paise integer not null,
  status text not null default 'pending',  -- pending, authorized, captured, failed, refunded
  captured_at timestamptz,
  refunded_at timestamptz,
  refund_amount_paise integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_order_id on payments(order_id);
create index idx_payments_razorpay on payments(razorpay_payment_id);

create table if not exists idempotency_keys (
  key text primary key,
  status text not null default 'pending',  -- pending, completed, failed
  result jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index idx_idempotency_expires on idempotency_keys(expires_at);

create table if not exists agent_keys (
  id text primary key,
  buyer_id uuid not null references auth.users(id),
  name text not null,
  scopes text[] not null default '{}',
  spend_envelope jsonb not null default '{}',
  hashed_secret text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_agent_keys_buyer_id on agent_keys(buyer_id);

create table if not exists processed_events (
  event_id text primary key,
  processed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index idx_processed_events_expires on processed_events(expires_at);

-- RLS
alter table orders enable row level security;
alter table payments enable row level security;
alter table idempotency_keys enable row level security;
alter table agent_keys enable row level security;
alter table processed_events enable row level security;

-- Orders: buyer reads own; service role writes
create policy "orders_read_own" on orders for select using (auth.uid() = buyer_id);
create policy "orders_write_service" on orders for all using (auth.role() = 'service_role');

-- Payments: readable via order; service role writes
create policy "payments_read_own" on payments for select using (
  exists (select 1 from orders where orders.id = payments.order_id and orders.buyer_id = auth.uid())
);
create policy "payments_write_service" on payments for all using (auth.role() = 'service_role');

-- Idempotency keys: service role only
create policy "idempotency_service" on idempotency_keys for all using (auth.role() = 'service_role');

-- Agent keys: buyer reads own; service role writes
create policy "agent_keys_read_own" on agent_keys for select using (auth.uid() = buyer_id);
create policy "agent_keys_write_service" on agent_keys for all using (auth.role() = 'service_role');

-- Processed events: service role only
create policy "processed_events_service" on processed_events for all using (auth.role() = 'service_role');