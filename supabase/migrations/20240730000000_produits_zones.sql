-- Codex #33b - produits ↔ zones_stock sync (direct FK + pivot)

-- 0) Extensions utilitaires
create extension if not exists pgcrypto;

-- 1) Restaurer la FK directe produits.zone_id si absente
alter table public.produits
  add column if not exists zone_id uuid;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_produits_zone_id'
  ) then
    alter table public.produits
      add constraint fk_produits_zone_id
      foreign key (zone_id) references public.zones_stock(id) on delete set null;
  end if;
end $$;

create index if not exists idx_produits_zone_id on public.produits(zone_id);

-- 2) Table pivot multi-zones
create table if not exists public.produits_zones (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  produit_id uuid not null references public.produits(id) on delete cascade,
  zone_id uuid not null references public.zones_stock(id) on delete cascade,
  actif boolean default true,
  stock_reel numeric default 0,
  stock_min  numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (mama_id, produit_id, zone_id)
);

create index if not exists idx_pz_mama on public.produits_zones(mama_id);
create index if not exists idx_pz_zone on public.produits_zones(zone_id);
create index if not exists idx_pz_prod on public.produits_zones(produit_id);

-- 3) RLS
alter table public.produits enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='produits' and policyname='produits_all') then
    create policy produits_all on public.produits
      for all using (mama_id = current_user_mama_id())
      with check (mama_id = current_user_mama_id());
  end if;
end $$;

alter table public.produits_zones enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='produits_zones' and policyname='pz_select') then
    create policy pz_select on public.produits_zones
      for select using (mama_id = current_user_mama_id());
  end if;
  if not exists (select 1 from pg_policies where tablename='produits_zones' and policyname='pz_iud') then
    create policy pz_iud on public.produits_zones
      for all using (mama_id = current_user_mama_id())
      with check (mama_id = current_user_mama_id());
  end if;
end $$;

grant select, insert, update, delete on public.produits_zones to authenticated;

-- 4) Trigger updated_at générique
create or replace function public.trg_set_timestamp() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists trg_pz_ts on public.produits_zones;
create trigger trg_pz_ts before update on public.produits_zones
for each row execute procedure public.trg_set_timestamp();

-- 5) Seed pivot à partir de la FK directe
insert into public.produits_zones(mama_id, produit_id, zone_id, actif, stock_reel, stock_min)
select distinct p.mama_id, p.id, p.zone_id, true, p.stock_reel, p.stock_min
from public.produits p
where p.zone_id is not null
  and not exists (
    select 1 from public.produits_zones px
    where px.mama_id = p.mama_id and px.produit_id = p.id and px.zone_id = p.zone_id
  );

-- 6) Triggers de synchro
create or replace function public.sync_pivot_from_produits() returns trigger as $$
begin
  if new.zone_id is null then
    return new;
  end if;

  insert into public.produits_zones(mama_id, produit_id, zone_id, actif)
  values (new.mama_id, new.id, new.zone_id, true)
  on conflict (mama_id, produit_id, zone_id)
  do update set actif = true, updated_at = now();

  update public.produits_zones
    set actif = false, updated_at = now()
  where mama_id = new.mama_id
    and produit_id = new.id
    and zone_id <> new.zone_id
    and actif is true;

  return new;
end $$ language plpgsql;

drop trigger if exists trg_prod_sync_zone on public.produits;
create trigger trg_prod_sync_zone
after insert or update of zone_id on public.produits
for each row execute procedure public.sync_pivot_from_produits();

create or replace function public.sync_produits_from_pivot() returns trigger as $$
begin
  if new.actif is true then
    update public.produits p
      set zone_id = new.zone_id, updated_at = now()
    where p.id = new.produit_id
      and p.mama_id = new.mama_id
      and (p.zone_id is distinct from new.zone_id);
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists trg_pz_sync_prod on public.produits_zones;
create trigger trg_pz_sync_prod
after insert or update of actif on public.produits_zones
for each row execute procedure public.sync_produits_from_pivot();

-- 7) Vue compatible
create or replace view public.v_produits_par_zone as
with base as (
  select
    p.mama_id,
    p.id as produit_id,
    p.nom as produit_nom,
    coalesce(pz.zone_id, p.zone_id) as zone_id,
    p.unite_id,
    p.stock_reel,
    p.stock_min
  from public.produits p
  left join lateral (
    select zone_id
    from public.produits_zones z
    where z.produit_id = p.id and z.mama_id = p.mama_id and z.actif = true
    limit 1
  ) pz on true
)
select
  b.mama_id,
  b.produit_id,
  b.produit_nom,
  z.id as zone_id,
  z.nom as zone_nom,
  z.type as zone_type,
  b.unite_id,
  b.stock_reel,
  b.stock_min
from base b
left join public.zones_stock z on z.id = b.zone_id
where b.zone_id is not null;

grant select on public.v_produits_par_zone to authenticated;

-- 8) Garde-fou réquisitions
drop policy if exists requisitions_insert on public.requisitions;
create policy requisitions_insert on public.requisitions
  for insert with check (
    mama_id = current_user_mama_id()
    and exists (
      select 1 from public.zones_stock z
      where z.id = zone_id and z.mama_id = mama_id and z.type in ('cave','shop')
    )
  );

-- RPC utilities (move/copy/merge/safe_delete_zone)
create or replace function public.move_zone_products(
  p_mama uuid,
  p_src_zone uuid,
  p_dst_zone uuid,
  p_keep_quantities boolean default true
) returns json language plpgsql security definer as $$
declare v_cnt int := 0;
begin
  perform 1 from public.zones_stock z where z.id in (p_src_zone, p_dst_zone) and z.mama_id = p_mama;
  if not found then raise exception 'zones_invalides'; end if;

  insert into public.produits_zones(mama_id, produit_id, zone_id, stock_reel, stock_min, actif)
  select p_mama, pz.produit_id, p_dst_zone,
         case when p_keep_quantities then pz.stock_reel else 0 end,
         pz.stock_min, true
  from public.produits_zones pz
  where pz.mama_id = p_mama and pz.zone_id = p_src_zone
  on conflict (mama_id, produit_id, zone_id)
  do update set
    stock_reel = excluded.stock_reel,
    stock_min = excluded.stock_min,
    actif = true,
    updated_at = now();

  get diagnostics v_cnt = row_count;

  update public.produits_zones
    set actif = false, updated_at = now()
  where mama_id = p_mama and zone_id = p_src_zone;

  return json_build_object('moved', v_cnt);
end $$;

grant execute on function public.move_zone_products(uuid,uuid,uuid,boolean) to authenticated;

create or replace function public.copy_zone_products(
  p_mama uuid,
  p_src_zone uuid,
  p_dst_zone uuid,
  p_with_quantities boolean default false
) returns json language plpgsql security definer as $$
declare v_cnt int := 0;
begin
  insert into public.produits_zones(mama_id, produit_id, zone_id, stock_reel, stock_min, actif)
  select p_mama, pz.produit_id, p_dst_zone,
         case when p_with_quantities then pz.stock_reel else 0 end,
         pz.stock_min, true
  from public.produits_zones pz
  where pz.mama_id = p_mama and pz.zone_id = p_src_zone
  on conflict (mama_id, produit_id, zone_id)
  do update set
    stock_reel = case when excluded.stock_reel is not null then excluded.stock_reel else public.produits_zones.stock_reel end,
    stock_min   = excluded.stock_min,
    actif = true,
    updated_at = now();
  get diagnostics v_cnt = row_count;
  return json_build_object('copied', v_cnt);
end $$;

grant execute on function public.copy_zone_products(uuid,uuid,uuid,boolean) to authenticated;

create or replace function public.merge_zone_products(
  p_mama uuid,
  p_src_zone uuid,
  p_dst_zone uuid
) returns json language plpgsql security definer as $$
declare v_cnt int := 0;
begin
  insert into public.produits_zones(mama_id, produit_id, zone_id, stock_reel, stock_min, actif)
  select p_mama, pz.produit_id, p_dst_zone, pz.stock_reel, pz.stock_min, true
  from public.produits_zones pz
  where pz.mama_id = p_mama and pz.zone_id = p_src_zone
  on conflict (mama_id, produit_id, zone_id)
  do update set
    stock_reel = coalesce(public.produits_zones.stock_reel,0) + coalesce(excluded.stock_reel,0),
    stock_min  = greatest(public.produits_zones.stock_min, excluded.stock_min),
    actif = true,
    updated_at = now();
  get diagnostics v_cnt = row_count;
  update public.produits_zones set actif=false, updated_at=now()
  where mama_id=p_mama and zone_id=p_src_zone;
  return json_build_object('merged', v_cnt);
end $$;

grant execute on function public.merge_zone_products(uuid,uuid,uuid) to authenticated;

create or replace function public.safe_delete_zone(
  p_mama uuid,
  p_zone uuid,
  p_reassign_to uuid default null
) returns json language plpgsql security definer as $$
declare v_cnt int := 0;
begin
  if p_reassign_to is not null then
    perform public.move_zone_products(p_mama, p_zone, p_reassign_to, true);
  end if;

  if exists(select 1 from public.produits_zones where mama_id=p_mama and zone_id=p_zone and actif=true) then
    raise exception 'zone_has_products';
  end if;

  delete from public.zones_stock where id = p_zone and mama_id = p_mama;
  get diagnostics v_cnt = row_count;
  return json_build_object('deleted', v_cnt);
end $$;

grant execute on function public.safe_delete_zone(uuid,uuid,uuid) to authenticated;
