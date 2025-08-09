-- Stock alerts module

-- 1) Add missing columns
alter table if exists produits
  add column if not exists stock_min numeric default 0,
  add column if not exists stock_theorique numeric default 0;

-- 2) View aggregating theoretical stock
create or replace view v_stock_theorique as
select
  p.id as produit_id,
  p.nom,
  p.mama_id,
  coalesce(sum(sm.quantite),0) as stock_actuel,
  p.stock_min,
  (
    coalesce(sum(sm.quantite),0)
    - coalesce(rq.quantite,0)
    + coalesce(cmd.quantite,0)
  ) as stock_projete
from produits p
left join stock_mouvements sm
  on sm.produit_id = p.id and sm.mama_id = p.mama_id
  and sm.actif is true
left join (
  select rl.produit_id, sum(rl.quantite) as quantite, r.mama_id
  from requisitions r
  join requisition_lignes rl on rl.requisition_id = r.id
  where r.statut = 'faite'
  group by rl.produit_id, r.mama_id
) rq on rq.produit_id = p.id and rq.mama_id = p.mama_id
left join (
  select cl.produit_id, sum(cl.quantite) as quantite, c.mama_id
  from commandes c
  join commande_lignes cl on cl.commande_id = c.id
  where c.statut in ('brouillon','envoyee')
  group by cl.produit_id, c.mama_id
) cmd on cmd.produit_id = p.id and cmd.mama_id = p.mama_id
group by p.id, p.nom, p.mama_id, p.stock_min;

-- 3) Stock alerts table
create table if not exists alertes_rupture (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id) on delete cascade,
  produit_id uuid not null references produits(id) on delete cascade,
  type text not null check (type in ('rupture','prevision')),
  stock_actuel numeric not null,
  stock_min numeric not null,
  stock_projete numeric,
  cree_le timestamptz default now(),
  traite boolean default false
);

create index if not exists idx_alertes_mama_produit on alertes_rupture(mama_id, produit_id);

-- 4) Row level security
alter table alertes_rupture enable row level security;

create policy alertes_select on alertes_rupture
  for select using (mama_id = current_user_mama_id());

create policy alertes_all on alertes_rupture
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

grant select, insert, update, delete on alertes_rupture to authenticated;

-- 5) RPC to generate alerts
create or replace function check_alertes_rupture(p_mama uuid)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  for r in
    select *
    from v_stock_theorique
    where mama_id = p_mama
      and stock_actuel <= stock_min
  loop
    insert into alertes_rupture (mama_id, produit_id, type, stock_actuel, stock_min, stock_projete)
    values (p_mama, r.produit_id, 'rupture', r.stock_actuel, r.stock_min, r.stock_projete)
    on conflict do nothing;

    perform notify_create(
      p_mama,
      'seuil',
      'warning',
      'Rupture imminente : ' || r.nom,
      'Stock actuel ' || r.stock_actuel || ' ≤ min ' || r.stock_min,
      '/produits/' || r.produit_id,
      jsonb_build_object(''produit_id'', r.produit_id)
    );
  end loop;

  for r in
    select *
    from v_stock_theorique
    where mama_id = p_mama
      and stock_projete <= stock_min
      and stock_actuel > stock_min
  loop
    insert into alertes_rupture (mama_id, produit_id, type, stock_actuel, stock_min, stock_projete)
    values (p_mama, r.produit_id, 'prevision', r.stock_actuel, r.stock_min, r.stock_projete)
    on conflict do nothing;

    perform notify_create(
      p_mama,
      'seuil',
      'info',
      'Prévision rupture : ' || r.nom,
      'Stock projeté ' || r.stock_projete || ' ≤ min ' || r.stock_min,
      '/produits/' || r.produit_id,
      jsonb_build_object(''produit_id'', r.produit_id)
    );
  end loop;
end;
$$;
