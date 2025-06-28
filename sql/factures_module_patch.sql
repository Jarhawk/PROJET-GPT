-- SQL patch ensuring integrity of factures module

-- Indexes for fast filtering
create index if not exists idx_factures_reference on factures(reference);
create index if not exists idx_factures_fournisseur on factures(fournisseur_id);
create index if not exists idx_factures_statut on factures(statut);
create index if not exists idx_facture_lignes_facture on facture_lignes(facture_id);
create index if not exists idx_facture_lignes_product on facture_lignes(product_id);

-- Foreign keys
alter table factures
  add constraint if not exists fk_factures_fournisseur
  foreign key (fournisseur_id) references fournisseurs(id) on delete set null;
alter table facture_lignes
  add constraint if not exists fk_facture_lignes_facture
  foreign key (facture_id) references factures(id) on delete cascade;
alter table facture_lignes
  add constraint if not exists fk_facture_lignes_product
  foreign key (product_id) references products(id) on delete set null;

-- Trigger to refresh totals when lines change
create or replace function refresh_facture_total()
returns trigger language plpgsql as $$
declare
  fid uuid := coalesce(new.facture_id, old.facture_id);
  ht numeric;
  tv numeric;
begin
  select sum(quantite * prix_unitaire),
         sum(quantite * prix_unitaire * (coalesce(tva,0)/100))
    into ht, tv
    from facture_lignes
   where facture_id = fid;
  update factures f
     set montant   = coalesce(ht,0) + coalesce(tv,0),
         total_ht  = coalesce(ht,0),
         total_tva = coalesce(tv,0),
         total_ttc = coalesce(ht,0) + coalesce(tv,0)
   where f.id = fid;
  return new;
end;
$$;

create or replace trigger trg_facture_total
after insert or update or delete on facture_lignes
for each row execute procedure refresh_facture_total();

-- Row level security policies
alter table factures enable row level security;
alter table factures force row level security;
drop policy if exists factures_all on factures;
create policy factures_all on factures for all
  using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table facture_lignes enable row level security;
alter table facture_lignes force row level security;
drop policy if exists facture_lignes_all on facture_lignes;
create policy facture_lignes_all on facture_lignes for all
  using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
