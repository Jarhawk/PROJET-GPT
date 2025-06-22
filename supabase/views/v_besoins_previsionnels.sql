create or replace view v_besoins_previsionnels as
select
  m.mama_id,
  m.id as menu_id,
  fl.product_id,
  sum(fl.quantite * coalesce(f.portions,1)) as quantite,
  sum(fl.quantite * coalesce(f.portions,1) * coalesce(p.pmp,0)) as valeur,
  p.nom as product_nom
from menus m
join menu_fiches mf on mf.menu_id = m.id
join fiches f on f.id = mf.fiche_id
join fiche_lignes fl on fl.fiche_id = f.id
left join products p on p.id = fl.product_id
group by m.mama_id, m.id, fl.product_id, p.nom, p.pmp;

grant select on v_besoins_previsionnels to authenticated;
