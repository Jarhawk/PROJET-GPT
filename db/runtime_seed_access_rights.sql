-- Lister vos utilisateurs (copiez l'id voulu)
select id, email, created_at from auth.users order by created_at desc;

-- Appliquer des droits de base à l'utilisateur ciblé (REMPLACEZ :user_id)
update public.utilisateurs
set access_rights = jsonb_strip_nulls('{
  "dashboard": true,
  "fournisseurs": true,
  "factures": true,
  "fiches_techniques": true,
  "menus": true,
  "menu_du_jour": true,
  "produits": true,
  "inventaires": true,
  "alertes": true,
  "promotions": true,
  "documents": true,
  "analyse": true,
  "menu_engineering": true,
  "costing_carte": true,
  "notifications": true,
  "utilisateurs": true,
  "roles": true,
  "mamas": true,
  "permissions": true,
  "access": true
}'::jsonb)
where auth_id = ':user_id';

-- Option: vérifier
select id, nom, access_rights from public.utilisateurs where auth_id=':user_id';
