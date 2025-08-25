-- RLS policies for factures and facture_lignes
alter table public.factures enable row level security;
alter table public.facture_lignes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='factures' and policyname='factures_select_by_mama') then
    create policy factures_select_by_mama on public.factures
      for select using (mama_id::text = auth.jwt()->>'mama_id');
  end if;
  if not exists (select 1 from pg_policies where tablename='factures' and policyname='factures_insert_check_mama') then
    create policy factures_insert_check_mama on public.factures
      for insert with check (mama_id::text = auth.jwt()->>'mama_id');
  end if;
  if not exists (select 1 from pg_policies where tablename='facture_lignes' and policyname='facture_lignes_select_by_mama') then
    create policy facture_lignes_select_by_mama on public.facture_lignes
      for select using (mama_id::text = auth.jwt()->>'mama_id');
  end if;
  if not exists (select 1 from pg_policies where tablename='facture_lignes' and policyname='facture_lignes_insert_check_mama') then
    create policy facture_lignes_insert_check_mama on public.facture_lignes
      for insert with check (mama_id::text = auth.jwt()->>'mama_id');
  end if;
end $$;

grant select, insert on factures to authenticated;
grant select, insert on facture_lignes to authenticated;
