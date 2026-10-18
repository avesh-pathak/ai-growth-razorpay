-- Migration 002: Policy Gate & trust spine tables (mandates, receipts, audit_events)

create table if not exists mandates (
  id text primary key,
  buyer_id uuid not null references auth.users(id),
  issuer text not null,           -- merchant ID
  envelope jsonb not null,         -- {max_per_order_paise, max_daily_paise, allowed_categories, allowed_skus, expiry, currency}
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  checkout_hash text,             -- bound to specific cart hash
  created_at timestamptz not null default now()
);

create index idx_mandates_buyer_id on mandates(buyer_id);
create index idx_mandates_issuer on mandates(issuer);

create table if not exists receipts (
  id text primary key,
  mandate_id text references mandates(id),
  order_id text,
  canonical_body jsonb not null,   -- proposal, rule checked, outcome, reason, hashes, mandate ref, razorpay IDs
  signature text not null,
  hash text not null,
  prev_hash text,
  created_at timestamptz not null default now()
);

create index idx_receipts_mandate_id on receipts(mandate_id);
create index idx_receipts_order_id on receipts(order_id);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor text not null,            -- 'merchant-agent', 'buyer-agent', 'policy-gate', 'system', 'user:uuid'
  action text not null,           -- 'proposal.created', 'policy.evaluated', 'checkout.completed', etc.
  entity_type text not null,      -- 'mandate', 'receipt', 'order', 'proposal', etc.
  entity_id text not null,
  payload jsonb not null default '{}',
  prev_hash text,
  hash text not null,
  -- append-only: prevent UPDATE and DELETE
  constraint audit_events_immutable check (true)
);

-- Trigger to prevent UPDATE and DELETE on audit_events
create or replace function prevent_audit_mutation()
returns trigger as $$
begin
  raise exception 'audit_events is append-only: UPDATE and DELETE are not allowed';
end;
$$ language plpgsql;

create trigger audit_events_no_update
  before update on audit_events
  for each row execute function prevent_audit_mutation();

create trigger audit_events_no_delete
  before delete on audit_events
  for each row execute function prevent_audit_mutation();

create index idx_audit_events_created_at on audit_events(created_at);
create index idx_audit_events_actor on audit_events(actor);
create index idx_audit_events_entity on audit_events(entity_type, entity_id);

-- RLS
alter table mandates enable row level security;
alter table receipts enable row level security;
alter table audit_events enable row level security;

-- Mandates: buyer can read their own; service role can write
create policy "mandates_read_own" on mandates for select using (auth.uid() = buyer_id);
create policy "mandates_write_service" on mandates for all using (auth.role() = 'service_role');

-- Receipts: readable by involved parties; service role writes
create policy "receipts_read_all" on receipts for select using (true);
create policy "receipts_write_service" on receipts for all using (auth.role() = 'service_role');

-- Audit events: readable by all authenticated; append-only (no update/delete via RLS)
create policy "audit_events_read_all" on audit_events for select using (true);
create policy "audit_events_insert_service" on audit_events for insert with check (auth.role() = 'service_role');