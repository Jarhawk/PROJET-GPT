-- Basic schema for MamaStock
create extension if not exists "uuid-ossp";

-- Establishments
create table if not exists mamas (
  id uuid primary key default uuid_generate_v4(),
  nom text not null
);

-- Users
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  role text not null default 'user',
  access_rights jsonb default '[]',
  actif boolean default true,
  mama_id uuid references mamas(id),
  created_at timestamp with time zone default now()
);

-- Suppliers
create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  ville text,
  actif boolean default true,
  mama_id uuid references mamas(id),
  created_at timestamp with time zone default now()
);

-- Products
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  famille text,
  unite text,
  pmp numeric,
  stock_reel numeric default 0,
  actif boolean default true,
  mama_id uuid references mamas(id),
  main_supplier uuid references suppliers(id),
  created_at timestamp with time zone default now()
);

-- Supplier prices for products
create table if not exists supplier_products (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  fournisseur uuid references suppliers(id) on delete cascade,
  prix_achat numeric,
  derniere_livraison date,
  mama_id uuid references mamas(id),
  updated_at timestamp with time zone default now()
);

-- Simple RLS example
alter table users enable row level security;
create policy "Users by mama" on users
  using (mama_id = auth.uid()) with check (mama_id = auth.uid());

