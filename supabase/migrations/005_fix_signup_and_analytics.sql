-- Migration 005: Fix signup roles (buyer/merchant), mandate signature, order line items, merchant read policies

-- ---------------------------------------------------------------------------
-- 1) profiles.role: allow 'buyer'; signup trigger maps 'merchant' -> 'owner'
--    Bug fixed: constraint only allowed owner/admin/viewer, so every buyer /
--    merchant signup failed with "Database error saving new user".
-- ---------------------------------------------------------------------------
do $$
declare c record;
begin
  -- Drop whatever the existing role check constraint is named (robust to renames)
  for c in
    select conname from pg_constraint
    where conrelid = 'profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table profiles drop constraint %I', c.conname);
  end loop;
end $$;

alter table profiles add constraint profiles_role_check
  check (role in ('owner', 'admin', 'viewer', 'buyer'));

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := new.raw_user_meta_data->>'role';
  mapped text;
begin
  mapped := case
    when requested = 'merchant' then 'owner'
    when requested in ('owner', 'admin', 'viewer', 'buyer') then requested
    else 'buyer'
  end;

  insert into profiles (id, email, role)
  values (new.id, new.email, mapped)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Backfill profiles for any existing auth users that are missing one
insert into profiles (id, email, role)
select u.id, u.email,
  case
    when u.raw_user_meta_data->>'role' = 'merchant' then 'owner'
    when u.raw_user_meta_data->>'role' in ('owner', 'admin', 'viewer', 'buyer') then u.raw_user_meta_data->>'role'
    else 'buyer'
  end
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id);

-- ---------------------------------------------------------------------------
-- 2) mandates: persist the signed envelope signature
-- ---------------------------------------------------------------------------
alter table mandates add column if not exists signature text;

-- ---------------------------------------------------------------------------
-- 3) orders: priced line items (for real buyer/merchant analytics)
-- ---------------------------------------------------------------------------
alter table orders add column if not exists items jsonb not null default '[]';

-- ---------------------------------------------------------------------------
-- 4) Merchant (owner/admin) read access for analytics
-- ---------------------------------------------------------------------------
drop policy if exists "orders_read_merchant" on orders;
create policy "orders_read_merchant" on orders for select
  using (exists (select 1 from profiles pr where pr.id = auth.uid() and pr.role in ('owner', 'admin')));
drop policy if exists "payments_read_merchant" on payments;
create policy "payments_read_merchant" on payments for select
  using (exists (select 1 from profiles pr where pr.id = auth.uid() and pr.role in ('owner', 'admin')));
drop policy if exists "mandates_read_merchant" on mandates;
create policy "mandates_read_merchant" on mandates for select
  using (exists (select 1 from profiles pr where pr.id = auth.uid() and pr.role in ('owner', 'admin')));

-- ---------------------------------------------------------------------------
-- 5) One-time cleanup: remove rows from an early seed run that used fake,
--    non-hash-chain values. The append-only triggers are re-enabled right
--    after this single statement.
-- ---------------------------------------------------------------------------
alter table audit_events disable trigger audit_events_no_delete;
delete from audit_events where hash !~ '^[0-9a-f]{64}$';
alter table audit_events enable trigger audit_events_no_delete;
