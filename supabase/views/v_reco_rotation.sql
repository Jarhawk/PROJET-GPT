create or replace view v_reco_rotation as
select
  p.id as product_id,
  p.nom,
  p.mama_id,
  current_date - coalesce(max(m.date), current_date) as jours_inactif
from products p
left join mouvements_stock m on m.product_id = p.id
where p.actif = true
group by p.id, p.nom, p.mama_id;

grant select on v_reco_rotation to authenticated;
