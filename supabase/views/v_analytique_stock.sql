create or replace view v_analytique_stock as
select
  m.date,
  m.product_id,
  p.famille,
  mc.cost_center_id,
  c.nom as cost_center_nom,
  c.activite,
  m.quantite,
  m.valeur,
  m.mama_id
from mouvements_stock m
left join mouvement_cost_centers mc on mc.mouvement_id = m.id
left join cost_centers c on c.id = mc.cost_center_id
left join products p on p.id = m.product_id;

grant select on v_analytique_stock to authenticated;
