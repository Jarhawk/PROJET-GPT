create or replace function fn_calc_budgets(mama_id_param uuid, periode_param text)
returns table(famille text, budget_prevu numeric, total_reel numeric, ecart_pct numeric)
language sql as $$
  with hist as (
    select to_char(f.date,'YYYY-MM') as mois,
           fam.nom as famille,
           sum(fl.total) as total
    from factures f
      join facture_lignes fl on fl.facture_id = f.id
      left join products p on p.id = fl.product_id
      left join familles fam on fam.id = p.famille_id
    where f.mama_id = mama_id_param
    group by 1,2
  ),
  moy as (
    select famille, avg(total) as avg_mensuel
    from hist
    where mois < periode_param
    group by famille
  ),
  courant as (
    select famille, sum(total) as total_reel
    from hist
    where mois = periode_param
    group by famille
  )
  select coalesce(m.famille, c.famille) as famille,
         coalesce(m.avg_mensuel,0) as budget_prevu,
         coalesce(c.total_reel,0) as total_reel,
         case when coalesce(m.avg_mensuel,0) = 0 then null
              else (coalesce(c.total_reel,0) - m.avg_mensuel)/m.avg_mensuel * 100
         end as ecart_pct
  from moy m
  full join courant c on c.famille = m.famille;
$$;

grant execute on function fn_calc_budgets to authenticated;
