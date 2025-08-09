-- View: v_costing_carte
create or replace view public.v_costing_carte as
select
  f.mama_id,
  f.id as fiche_id,
  f.nom,
  f.type,
  f.famille,
  f.actif,
  cf.cout,
  cf.portions,
  case 
    when cf.portions is null or cf.portions = 0 then null
    else cf.cout / cf.portions
  end as cout_par_portion,
  f.prix_vente,
  (coalesce(f.prix_vente,0) - coalesce(cf.cout / nullif(cf.portions,0),0)) as marge_euro,
  case
    when f.prix_vente is null or f.prix_vente = 0 then null
    else round(((coalesce(f.prix_vente,0) - coalesce(cf.cout / nullif(cf.portions,0),0)) / f.prix_vente) * 100, 2)
  end as marge_pct,
  case
    when f.prix_vente is null or f.prix_vente = 0 then null
    else round((coalesce(cf.cout / nullif(cf.portions,0),0) / f.prix_vente) * 100, 2)
  end as food_cost_pct
from public.fiches_techniques f
left join public.v_couts_fiches cf 
  on cf.fiche_id = f.id and cf.mama_id = f.mama_id;
