-- View to expose familles with their sous-familles using the two-level model
create or replace view public.v_familles_sous_familles as
select
  f.id as famille_id,
  f.nom as famille_nom,
  sf.id as sous_famille_id,
  sf.nom as sous_famille_nom
from familles f
left join sous_familles sf on sf.famille_id = f.id;
