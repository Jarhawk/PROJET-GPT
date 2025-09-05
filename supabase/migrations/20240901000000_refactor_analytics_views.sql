-- Introspection and schema normalization
-- Using public.achats for purchases (columns: mama_id, fournisseur_id, date_achat, quantite, prix)
-- Using public.mouvements_stock for consumptions (columns: mama_id, produit_id, sens, quantite, fait_le)
-- Enrichments via public.produits, public.unites and public.fournisseurs

-- 1) JWT helpers (JWT only)
create or replace function public.current_user_mama_id()
returns uuid
language sql stable set search_path=public as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'mama_id','')::uuid;
$$;

create or replace function public.current_user_timezone()
returns text
language sql stable set search_path=public as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::json ->> 'timezone',''),
    nullif(current_setting('request.jwt.claims', true)::json ->> 'tz',''),
    'UTC'
  );
$$;

grant execute on function public.current_user_mama_id(), public.current_user_timezone() to authenticated, anon;

-- 2) Indexation des tables sources
-- Achats (tête/lignes)
do $$ begin
  if to_regclass('public.achats') is not null then
    create index if not exists idx_achats_mama_date on public.achats(mama_id, date_achat);
    create index if not exists idx_achats_mama_frs on public.achats(mama_id, fournisseur_id);
  end if;
  if to_regclass('public.achats_lignes') is not null then
    create index if not exists idx_achats_lignes_mama_fk on public.achats_lignes(mama_id, achat_id);
  end if;
end $$;

-- Utilisations / mouvements
-- Table utilisations may be absent; handle conditionally
-- create index on utilisations if present
-- and on mouvements_stock (using fait_le as date)
do $$ begin
  if to_regclass('public.utilisations') is not null then
    create index if not exists idx_utilisations_mama_date on public.utilisations(mama_id, date_utilisation);
  end if;
  if to_regclass('public.mouvements_stock') is not null then
    create index if not exists idx_mouvements_stock_mama_date on public.mouvements_stock(mama_id, fait_le);
  end if;
end $$;

-- Produits / Fournisseurs (for optional LEFT JOINs)
do $$ begin
  if to_regclass('public.produits') is not null then
    create index if not exists idx_produits_mama on public.produits(mama_id);
  end if;
  if to_regclass('public.fournisseurs') is not null then
    create index if not exists idx_fournisseurs_mama on public.fournisseurs(mama_id);
  end if;
end $$;

-- 3) v_evolution_achats (prod)
create or replace view public.v_evolution_achats as
with src_achats as (
  -- Source: public.achats (no lignes table found)
  select a.mama_id, a.fournisseur_id, a.date_achat as date_op,
         (a.quantite * coalesce(a.prix,0))::numeric as montant
  from public.achats a
  where a.mama_id = public.current_user_mama_id()
)
select
  date_trunc('month', date_op at time zone public.current_user_timezone())::timestamptz as mois,
  sum(montant)::numeric as montant,
  mama_id
from src_achats
group by 1,3
order by 1 asc;

grant select on public.v_evolution_achats to authenticated;

-- 4) v_top_fournisseurs (prod)
create or replace view public.v_top_fournisseurs as
with src_achats as (
  -- Source: public.achats (no lignes table found)
  select a.mama_id, a.fournisseur_id, a.date_achat as date_op,
         (a.quantite * coalesce(a.prix,0))::numeric as montant
  from public.achats a
  where a.mama_id = public.current_user_mama_id()
)
select
  fournisseur_id,
  sum(montant)::numeric as montant,
  date_trunc('month', date_op at time zone public.current_user_timezone())::timestamptz as mois,
  mama_id
from src_achats
group by 1,3,4
order by mois asc, montant desc;

grant select on public.v_top_fournisseurs to authenticated;

-- 5) v_produits_utilises (prod)
create or replace view public.v_produits_utilises as
with conso as (
  -- Using public.mouvements_stock for OUT movements
  select m.mama_id, m.produit_id, m.quantite::numeric,
         m.fait_le as date_op
  from public.mouvements_stock m
  where m.mama_id = public.current_user_mama_id()
    and upper(m.sens) = 'OUT'
)
select
  c.produit_id,
  p.nom as produit_nom,
  c.quantite,
  c.date_op as date_utilisation,
  c.mama_id
from conso c
left join public.produits p
  on p.id = c.produit_id
 and p.mama_id = c.mama_id
order by c.date_op desc;

grant select on public.v_produits_utilises to authenticated;

-- 6) v_alertes_rupture_api — enriched with unite and fournisseur_nom
create or replace view public.v_alertes_rupture_api as
with base as (
  select
    p.id                                as produit_id,
    p.id                                as id,
    p.nom                               as nom,
    coalesce(p.stock_reel,0)            as stock_actuel,
    coalesce(p.stock_min,0)::numeric    as stock_min,
    p.unite_id,
    p.fournisseur_id,
    p.mama_id
  from public.produits p
  where p.mama_id = public.current_user_mama_id()
    and coalesce(p.stock_reel,0) <= coalesce(p.stock_min,0)
)
select
  b.produit_id,
  b.id,
  b.nom,
  u.nom as unite,
  f.nom as fournisseur_nom,
  b.stock_actuel,
  b.stock_min,
  greatest(b.stock_min - b.stock_actuel, 0)::numeric as manque,
  NULL::numeric as consommation_prevue,
  NULL::numeric as receptions,
  NULL::numeric as stock_projete,
  NULL::text    as type
from base b
left join public.unites u on u.id = b.unite_id and u.mama_id = b.mama_id
left join public.fournisseurs f on f.id = b.fournisseur_id and f.mama_id = b.mama_id
order by manque desc;

grant select on public.v_alertes_rupture_api to authenticated;

-- 7) RLS policies (ensure mama isolation)
-- Achats
 do $$ begin
  if to_regclass('public.achats') is not null then
    execute 'alter table public.achats enable row level security';
    execute 'alter table public.achats force row level security';
    execute 'drop policy if exists achats_all on public.achats';
    execute $sql$create policy achats_all on public.achats
      for all using (mama_id = public.current_user_mama_id())
      with check (mama_id = public.current_user_mama_id());$sql$;
    execute 'grant select on public.achats to authenticated';
  end if;
end $$;

-- Mouvements stock
 do $$ begin
  if to_regclass('public.mouvements_stock') is not null then
    execute 'alter table public.mouvements_stock enable row level security';
    execute 'alter table public.mouvements_stock force row level security';
    execute 'drop policy if exists mouvements_stock_all on public.mouvements_stock';
    execute $sql$create policy mouvements_stock_all on public.mouvements_stock
      for all using (mama_id = public.current_user_mama_id())
      with check (mama_id = public.current_user_mama_id());$sql$;
    execute 'grant select on public.mouvements_stock to authenticated';
  end if;
end $$;

-- Produits
 do $$ begin
  if to_regclass('public.produits') is not null then
    execute 'alter table public.produits enable row level security';
    execute 'alter table public.produits force row level security';
    execute 'drop policy if exists produits_all on public.produits';
    execute $sql$create policy produits_all on public.produits
      for all using (mama_id = public.current_user_mama_id())
      with check (mama_id = public.current_user_mama_id());$sql$;
    execute 'grant select on public.produits to authenticated';
  end if;
end $$;

-- Fournisseurs
 do $$ begin
  if to_regclass('public.fournisseurs') is not null then
    execute 'alter table public.fournisseurs enable row level security';
    execute 'alter table public.fournisseurs force row level security';
    execute 'drop policy if exists fournisseurs_all on public.fournisseurs';
    execute $sql$create policy fournisseurs_all on public.fournisseurs
      for all using (mama_id = public.current_user_mama_id())
      with check (mama_id = public.current_user_mama_id());$sql$;
    execute 'grant select on public.fournisseurs to authenticated';
  end if;
end $$;

