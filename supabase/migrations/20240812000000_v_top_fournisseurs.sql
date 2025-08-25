-- Create view for top fournisseurs
create or replace view public.v_top_fournisseurs as
select
  mama_id,
  fournisseur_id,
  mois,
  montant
from public.fournisseur_achats_mois;

-- Enable RLS on aggregated table
alter table if exists public.fournisseur_achats_mois enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fournisseur_achats_mois'
      and policyname = 'fournisseur_achats_mois_select'
  ) then
    create policy fournisseur_achats_mois_select on public.fournisseur_achats_mois
      for select using (mama_id::text = auth.jwt()->>'mama_id');
  end if;
end $$;

grant select on public.fournisseur_achats_mois to authenticated;
grant select on public.v_top_fournisseurs to authenticated;
