create table if not exists public.zones_stock (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null,
  nom text not null,
  type text,
  parent_id uuid null,
  position int default 0,
  actif boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.zones_stock
  add column if not exists parent_id uuid null,
  add column if not exists position int default 0,
  add column if not exists type text,
  add column if not exists actif boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.zones_stock
  add constraint if not exists zones_stock_parent_fk
  foreign key (parent_id) references public.zones_stock(id) on delete set null;

create index if not exists idx_zones_stock_mama on public.zones_stock(mama_id);
create index if not exists idx_zones_stock_position on public.zones_stock(mama_id, position);
create index if not exists idx_zones_stock_nom on public.zones_stock(mama_id, nom);

create or replace function public.trg_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_zones_stock_updated_at'
      and tgrelid = 'public.zones_stock'::regclass
  ) then
    create trigger trg_zones_stock_updated_at
      before update on public.zones_stock
      for each row execute function public.trg_set_timestamp();
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'zones_stock'
      and column_name = 'mama_id'
  ) and not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'zones_stock'
  ) then
    alter table public.zones_stock enable row level security;
    create policy zones_stock_mama_rls
      on public.zones_stock for all
      using (mama_id = public.current_user_mama_id())
      with check (mama_id = public.current_user_mama_id());
  end if;
end $$;
