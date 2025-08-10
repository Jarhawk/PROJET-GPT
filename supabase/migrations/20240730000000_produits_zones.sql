-- Codex #33 - produits_zones pivot + utilities

-- 1) Table pivot
create table if not exists public.produits_zones (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  produit_id uuid not null references public.produits(id) on delete cascade,
  zone_id uuid not null references public.zones_stock(id) on delete cascade,
  stock_reel numeric default 0,
  stock_min numeric default 0,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (mama_id, produit_id, zone_id)
);

create index if not exists idx_pz_mama on public.produits_zones(mama_id);
create index if not exists idx_pz_zone on public.produits_zones(zone_id);
create index if not exists idx_pz_prod on public.produits_zones(produit_id);

-- updated_at trigger
create or replace function public.trg_set_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pz_ts on public.produits_zones;
create trigger trg_pz_ts before update on public.produits_zones
for each row execute procedure public.trg_set_timestamp();

-- RLS
alter table public.produits_zones enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'pz_select'
  ) then
    create policy pz_select on public.produits_zones
      for select using (mama_id = public.current_user_mama_id());
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'pz_iud'
  ) then
    create policy pz_iud on public.produits_zones
      for all using (mama_id = public.current_user_mama_id())
      with check (mama_id = public.current_user_mama_id());
  end if;
end $$;

grant select, insert, update, delete on public.produits_zones to authenticated;

-- 2) Practical view
create or replace view public.v_produits_par_zone as
select
  pz.id,
  pz.mama_id,
  z.id as zone_id,
  z.nom as zone_nom,
  z.type as zone_type,
  pr.id as produit_id,
  pr.nom as produit_nom,
  pr.unite_id,
  pz.stock_reel,
  pz.stock_min,
  pz.actif
from public.produits_zones pz
join public.zones_stock z on z.id = pz.zone_id
join public.produits pr on pr.id = pz.produit_id
where pz.actif = true;

grant select on public.v_produits_par_zone to authenticated;

-- 3) RPC utilities
create or replace function public.move_zone_products(
  p_mama uuid,
  p_src_zone uuid,
  p_dst_zone uuid,
  p_keep_quantities boolean default true
) returns json language plpgsql security definer as $$
declare
  v_cnt int := 0;
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

-- 4) Requisition guard
create or replace policy requisitions_insert on public.requisitions
  for insert with check (
    mama_id = current_user_mama_id()
    and exists (
      select 1 from public.zones_stock z where z.id = zone_id and z.mama_id = mama_id and z.type in ('cave','shop')
    )
  );
