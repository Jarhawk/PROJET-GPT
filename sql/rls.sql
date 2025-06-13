-- rls.sql - Row Level Security policies for MamaStock

-- Helper function assumed defined in init.sql: current_user_mama_id()

-- Users table
alter table if exists users enable row level security;
alter table if exists users force row level security;
create policy users_select on users for select using (id = auth.uid());
create policy users_mod on users for update using (id = auth.uid()) with check (id = auth.uid());
create policy users_insert on users for insert with check (
  id = auth.uid() and mama_id = current_user_mama_id()
);

-- Roles table (read-only for now)
alter table roles enable row level security;
alter table roles force row level security;
create policy roles_select on roles for select using (true);

-- Tables filtered by mama_id
alter table mamas enable row level security;
alter table mamas force row level security;
create policy mamas_all on mamas for all
  using (id = current_user_mama_id())
  with check (id = current_user_mama_id());

alter table fournisseurs enable row level security;
alter table fournisseurs force row level security;
create policy fournisseurs_all on fournisseurs for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table products enable row level security;
alter table products force row level security;
create policy products_all on products for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table supplier_products enable row level security;
alter table supplier_products force row level security;
create policy supplier_products_all on supplier_products for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table factures enable row level security;
alter table factures force row level security;
create policy factures_all on factures for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table facture_lignes enable row level security;
alter table facture_lignes force row level security;
create policy facture_lignes_all on facture_lignes for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fiches enable row level security;
alter table fiches force row level security;
create policy fiches_all on fiches for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fiche_lignes enable row level security;
alter table fiche_lignes force row level security;
create policy fiche_lignes_all on fiche_lignes for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fiche_cout_history enable row level security;
alter table fiche_cout_history force row level security;
create policy fiche_cout_history_all on fiche_cout_history for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table inventaires enable row level security;
alter table inventaires force row level security;
create policy inventaires_all on inventaires for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table inventaire_lignes enable row level security;
alter table inventaire_lignes force row level security;
create policy inventaire_lignes_all on inventaire_lignes for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table mouvements_stock enable row level security;
alter table mouvements_stock force row level security;
create policy mouvements_stock_all on mouvements_stock for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table familles enable row level security;
alter table familles force row level security;
create policy familles_all on familles for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table unites enable row level security;
alter table unites force row level security;
create policy unites_all on unites for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table parametres enable row level security;
alter table parametres force row level security;
create policy parametres_all on parametres for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fournisseur_contacts enable row level security;
alter table fournisseur_contacts force row level security;
create policy fournisseur_contacts_all on fournisseur_contacts for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fournisseur_notes enable row level security;
alter table fournisseur_notes force row level security;
create policy fournisseur_notes_all on fournisseur_notes for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table permissions enable row level security;
alter table permissions force row level security;
create policy permissions_all on permissions for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table menus enable row level security;
alter table menus force row level security;
create policy menus_all on menus for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table menu_fiches enable row level security;
alter table menu_fiches force row level security;
create policy menu_fiches_all on menu_fiches for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table requisitions enable row level security;
alter table requisitions force row level security;
create policy requisitions_all on requisitions for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table requisition_lines enable row level security;
alter table requisition_lines force row level security;
create policy requisition_lines_all on requisition_lines for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table transferts enable row level security;
alter table transferts force row level security;
create policy transferts_all on transferts for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table zones_stock enable row level security;
alter table zones_stock force row level security;
create policy zones_stock_all on zones_stock for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table ventes_boissons enable row level security;
alter table ventes_boissons force row level security;
create policy ventes_boissons_all on ventes_boissons for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

-- Grants
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;
