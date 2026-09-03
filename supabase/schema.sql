-- Pagate schema: Auth profiles + multi-tenant stores
-- Run in Supabase SQL editor (or supabase db push).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  bio text not null default '',
  headline text not null default '',
  avatar_initials text not null default '??',
  availability jsonb not null default '{
    "timezone":"America/Santiago",
    "weekdays":[1,2,3,4,5],
    "startHour":10,
    "endHour":18,
    "slotMinutes":60
  }'::jsonb,
  google_calendar jsonb,
  onboarding_completed_at timestamptz,
  onboarding_step text not null default 'handle',
  intended_product_types text[] not null default '{}',
  download_expiry_days integer default 7,
  download_max_count integer not null default 2,
  payment_settings jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  avatar_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists stores_username_lower_idx
  on public.stores (lower(username));

create table if not exists public.products (
  id text primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  type text not null check (type in ('digital', 'session')),
  name text not null,
  description text not null default '',
  price_clp integer not null,
  duration_minutes integer,
  file_name text,
  file_path text,
  created_at timestamptz not null default now()
);

create index if not exists products_store_id_idx on public.products (store_id);

create table if not exists public.purchases (
  id text primary key,
  token text not null unique,
  product_id text not null references public.products (id),
  store_id uuid not null references public.stores (id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  amount_clp integer not null,
  status text not null check (status in ('pending', 'paid', 'rejected')),
  downloads_remaining integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  slot_start timestamptz,
  slot_end timestamptz,
  meet_url text,
  google_event_id text,
  mp_preference_id text,
  mp_payment_id text,
  payment_method text not null default 'mercadopago'
);

create index if not exists purchases_store_id_idx on public.purchases (store_id);
create index if not exists purchases_token_idx on public.purchases (token);

create table if not exists public.google_calendar_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text,
  scope text,
  token_type text,
  expiry_date bigint,
  email text,
  updated_at timestamptz not null default now()
);

create table if not exists public.mercadopago_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text,
  public_key text,
  mp_user_id text,
  live_mode boolean,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists mercadopago_tokens_mp_user_id_idx
  on public.mercadopago_tokens (mp_user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.google_calendar_tokens enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "stores public read" on public.stores;
create policy "stores public read"
  on public.stores for select
  to anon, authenticated
  using (true);

drop policy if exists "stores insert own" on public.stores;
create policy "stores insert own"
  on public.stores for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "stores update own" on public.stores;
create policy "stores update own"
  on public.stores for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "products write own store" on public.products;
create policy "products write own store"
  on public.products for all
  to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = products.store_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = products.store_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "purchases owner read" on public.purchases;
create policy "purchases owner read"
  on public.purchases for select
  to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = purchases.store_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "gcal tokens own" on public.google_calendar_tokens;
create policy "gcal tokens own"
  on public.google_calendar_tokens for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.mercadopago_tokens enable row level security;
drop policy if exists "mp tokens own" on public.mercadopago_tokens;
create policy "mp tokens own"
  on public.mercadopago_tokens for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Idempotent upgrades for existing projects
alter table public.stores add column if not exists onboarding_step text not null default 'handle';
alter table public.stores add column if not exists intended_product_types text[] not null default '{}';
alter table public.stores add column if not exists download_expiry_days integer default 7;
alter table public.stores add column if not exists download_max_count integer not null default 2;
alter table public.stores add column if not exists payment_settings jsonb not null default '{}'::jsonb;
alter table public.stores add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.stores add column if not exists avatar_url text;

-- Purchases reference products without ON DELETE CASCADE; remove those rows first.
delete from public.purchases
where store_id = '11111111-1111-4111-8111-111111111111';

delete from public.products
where store_id = '11111111-1111-4111-8111-111111111111';

delete from public.stores
where id = '11111111-1111-4111-8111-111111111111';

alter table public.purchases add column if not exists payment_method text not null default 'mercadopago';
