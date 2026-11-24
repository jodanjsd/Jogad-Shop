-- Jogad Storefront Supabase PostgreSQL Schema
-- Run this once in your Supabase Dashboard -> SQL Editor

create table if not exists public.products (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  category text not null,
  subcategory text not null default '',
  occasions jsonb not null default '[]'::jsonb,
  badge text not null default 'None',
  gift_note text,
  price numeric not null,
  original_price numeric not null,
  rating numeric not null default 4.8,
  review_count integer not null default 0,
  image text not null default '',
  features jsonb not null default '[]'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  description text not null default '',
  warranty_months integer not null default 12,
  variants jsonb not null default '[]'::jsonb,
  collections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shipping_config (
  id text primary key default 'default',
  free_shipping_threshold numeric not null default 30000,
  cod_max_limit numeric not null default 150000,
  announcement_enabled boolean not null default true,
  regional_rules jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  waybill_number text not null,
  created_at timestamptz not null default now(),
  customer jsonb not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null,
  shipping_fee numeric not null,
  total numeric not null,
  payment_method text not null,
  payment_status text not null,
  payment_reference text,
  high_value_verified boolean not null default true,
  requires_high_value_verification boolean not null default false,
  current_stage text not null default 'Order Placed',
  courier_name text not null default 'JogadExpress Lagos Dispatch',
  rider_phone text,
  milestones jsonb not null default '[]'::jsonb
);

create table if not exists public.customer_accounts (
  id text primary key,
  contact text unique not null,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  addresses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  email text primary key,
  subscribed_at timestamptz not null default now()
);

create table if not exists public.carts (
  cart_key text primary key,
  account_id text,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.products enable row level security;
alter table public.shipping_config enable row level security;
alter table public.orders enable row level security;
alter table public.customer_accounts enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.carts enable row level security;

-- Storefront API policies (for enhanced security, configure SUPABASE_SERVICE_ROLE_KEY on the Express server
-- and restrict write policies to authenticated service_role only).
drop policy if exists "Allow anon read products" on public.products;
create policy "Allow anon read products" on public.products for select using (true);

drop policy if exists "Allow anon write products" on public.products;
create policy "Allow anon write products" on public.products for all using (true) with check (true);

drop policy if exists "Allow anon read shipping_config" on public.shipping_config;
create policy "Allow anon read shipping_config" on public.shipping_config for select using (true);

drop policy if exists "Allow anon write shipping_config" on public.shipping_config;
create policy "Allow anon write shipping_config" on public.shipping_config for all using (true) with check (true);

drop policy if exists "Allow anon all orders" on public.orders;
create policy "Allow anon all orders" on public.orders for all using (true) with check (true);

drop policy if exists "Allow anon all customer_accounts" on public.customer_accounts;
create policy "Allow anon all customer_accounts" on public.customer_accounts for all using (true) with check (true);

drop policy if exists "Allow anon all newsletter_subscribers" on public.newsletter_subscribers;
create policy "Allow anon all newsletter_subscribers" on public.newsletter_subscribers for all using (true) with check (true);

drop policy if exists "Allow anon all carts" on public.carts;
create policy "Allow anon all carts" on public.carts for all using (true) with check (true);

-- Refresh PostgREST schema cache immediately
notify pgrst, 'reload schema';
