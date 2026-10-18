-- Migration 001: Catalog tables (products + skus)
-- Kindred Coffee Supply catalog

create table if not exists products (
  id text primary key,
  name text not null,
  brand text not null default 'Kindred Coffee Supply',
  description text,
  category text not null,
  subcategory text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists skus (
  id text primary key,
  product_id text not null references products(id) on delete cascade,
  name text not null,
  slug text not null unique,
  variant_attrs jsonb not null default '{}',
  cost_price_paise integer not null,
  list_price_paise integer not null,
  margin_pct numeric(5,2) not null,
  stock integer not null default 0,
  rating numeric(3,2) not null default 0,
  reviews integer not null default 0,
  tags text[] not null default '{}',
  compatibility text[] not null default '{}',
  pairs_with text[] not null default '{}',
  weight text,
  dimensions text,
  image_url text,
  badge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_skus_product_id on skus(product_id);
create index idx_skus_category on skus using gin(tags);
create index idx_skus_slug on skus(slug);

-- RLS
alter table products enable row level security;
alter table skus enable row level security;

-- Anyone can read catalog
create policy "products_read_all" on products for select using (true);
create policy "skus_read_all" on skus for select using (true);

-- Only service role can write (admin via dashboard uses service role)
create policy "products_write_service" on products for all using (auth.role() = 'service_role');
create policy "skus_write_service" on skus for all using (auth.role() = 'service_role');