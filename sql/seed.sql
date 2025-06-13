-- seed.sql - Example seed data for MamaStock
insert into roles (nom, description) values
  ('superadmin','Super Administrateur'),
  ('admin','Administrateur'),
  ('user','Utilisateur')
  on conflict do nothing;

insert into mamas (id, nom) values
  ('00000000-0000-0000-0000-000000000001','Mama Demo')
  on conflict do nothing;

insert into users (id, email, role_id, mama_id, actif)
values ('00000000-0000-0000-0000-000000000001','admin@mamastock.com',1,'00000000-0000-0000-0000-000000000001',true)
  on conflict do nothing;

insert into unites (nom, abbr, mama_id) values
  ('Kilogramme','kg','00000000-0000-0000-0000-000000000001'),
  ('Pièce','pc','00000000-0000-0000-0000-000000000001')
  on conflict do nothing;

insert into familles (nom, mama_id) values
  ('Général','00000000-0000-0000-0000-000000000001')
  on conflict do nothing;

insert into fournisseurs (id, nom, mama_id) values
  ('00000000-0000-0000-0000-000000000010','Fournisseur Demo','00000000-0000-0000-0000-000000000001')
  on conflict do nothing;

insert into products (id, nom, famille_id, unite_id, mama_id, main_supplier_id)
values (
  '00000000-0000-0000-0000-000000000100',
  'Produit Demo',
  (select id from familles limit 1),
  (select id from unites limit 1),
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010'
) on conflict do nothing;

insert into fiches (id, nom, portions, mama_id)
values ('00000000-0000-0000-0000-000000000200','Fiche Demo',10,'00000000-0000-0000-0000-000000000001')
on conflict do nothing;

insert into menus (id, nom, date, mama_id)
values ('00000000-0000-0000-0000-000000000300','Menu Demo', current_date,'00000000-0000-0000-0000-000000000001')
on conflict do nothing;

insert into menu_fiches (menu_id, fiche_id, mama_id)
values ('00000000-0000-0000-0000-000000000300','00000000-0000-0000-0000-000000000200','00000000-0000-0000-0000-000000000001')
on conflict do nothing;

insert into zones_stock (id, nom, mama_id)
values ('00000000-0000-0000-0000-000000000400','Cuisine','00000000-0000-0000-0000-000000000001')
on conflict do nothing;

insert into permissions (role_id, module, droit, mama_id)
values (1,'fournisseurs','read','00000000-0000-0000-0000-000000000001')
on conflict do nothing;
