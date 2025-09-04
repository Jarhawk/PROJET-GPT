# Audit global MamaStock

## 1) Synthèse exécutive
- **Score de cohérence Front↔Back** : 40/100 (analyse étendue mais encore partielle)
- **Top 10 écarts bloquants**
  1. Script d'analyse `schema:analyze` échoue toujours (référence SQL absente).
  2. Tests unitaires en échec (chemins de fichiers divergents).
  3. Hooks avec doublons d'identifiant `loading`.
  4. Tables SQL minimales pour `factures`, `bons_livraison`, `commandes` sans colonnes attendues par le front.
  5. Vues `v_pmp`, `v_stocks`, `v_products_last_price`, `v_requisitions` sans filtre `mama_id` explicite.
  6. Fonctions manquantes (`trg_set_timestamp`, `current_user_is_admin_or_manager`).
  7. RLS non confirmée pour plusieurs tables (notamment `inventaires`, `requisitions`).
  8. Routes nombreuses sans vérification d'accès effective.
  9. Tests de scripts (`export_accounting`, `weekly_report`) échouent.
  10. Analyse des nouveaux modules (`fiches`, `menu du jour`, `menu engineering`) ajoute des écarts supplémentaires.
- **Priorités**
  1. Corriger l'exécution des scripts d'analyse et tests.
  2. Reconciler colonnes front/back pour modules critiques (`fournisseurs`, `produits`, `factures`, `bons_livraison`, `commandes`, `fiches`, `menus`).
  3. Ajouter/valider les fonctions, vues et policies SQL manquantes.

## 2) Carte des modules
| Module | Pages (path → fichier) | Hooks clés | Tables/Vues/Fn SQL | État | Remarques |
|--------|------------------------|-----------|--------------------|------|-----------|
| Fournisseurs | `/fournisseurs` → `src/pages/fournisseurs/Fournisseurs.jsx` | `useFournisseurs.js` | Tables: `fournisseurs`, `fournisseur_contacts` | ⚠️ | Vérifier colonnes et RLS |
| Produits | `/produits` → `src/pages/produits/Produits.jsx` | `useProducts.js` | Tables: `produits`; vues: `v_pmp`, `v_stocks`, `v_products_last_price` | ⚠️ | Vues sans filtre `mama_id` |
| Achats | `/achats` → `src/pages/achats/Achats.jsx` | `useAchats.js` | Table: `achats` | ⚠️ | Policy `achats_all` à vérifier |
| Promotions | `/promotions` → `src/pages/promotions/Promotions.jsx` | `usePromotions.js` | Table: `promotions` | ⚠️ | Policy `promotions_all` à confirmer |
| Factures/BL | `/factures`, `/bons-livraison` → `src/pages/factures/Factures.jsx`, `src/pages/bons_livraison/BonsLivraison.jsx` | `useFactures.js`, `useBonsLivraison.js` | Tables: `factures`, `bons_livraison`, `lignes_bl` | ❌ | Schéma SQL incomplet |
| Inventaires | `/inventaire` → `src/pages/inventaire/Inventaire.jsx` | `useInventaires.js` | Tables: `inventaires`, `inventaire_zones`, `produits_inventaire` | ⚠️ | RLS non vérifiée |
| Commandes | `/commandes` → `src/pages/commandes/Commandes.jsx` | `useCommandes.js` | Tables: `commandes`, `commande_lignes` | ❌ | Colonnes manquantes |
| Transferts | `/transferts` → `src/pages/stock/Transferts.jsx` | `useTransferts.js` | Tables: `transferts`, `transfert_lignes` | ⚠️ | Noms `zone_depart`/`zone_arrivee` absents |
| Réquisitions | `/requisitions` → `src/pages/requisitions/Requisitions.jsx` | `useRequisitions.js` | Tables: `requisitions`, `requisition_lignes`; vue: `v_requisitions` | ⚠️ | Vue sans filtre `mama_id` |
| Tâches | `/taches` → `src/pages/taches/Taches.jsx` | `useTaches.js` | Table: `taches` | ⚠️ | Doublons `loading` |
| Fiches techniques | `/fiches` → `src/pages/fiches/Fiches.jsx` | `useFiches.js` | Tables: `fiches_techniques`, `fiche_lignes`; vue: `v_fiche_lignes_complete` | ⚠️ | Vue à valider |
| Menu du jour | `/menu`, `/menu/:date` → `src/pages/menu/MenuDuJour.jsx`, `src/pages/menu/MenuDuJourJour.jsx` | `useMenuDuJour.js` | Tables: `menus_jour`, `menus_jour_fiches` | ⚠️ | Calcul coût client |
| Menu engineering | `/menu-engineering` → `src/pages/engineering/MenuEngineering.jsx` | `useMenuEngineering.js` | Vues: `v_me_classification`, `v_menu_du_jour_mensuel`; tables: `ventes_import_staging`, `ventes_fiches` | ⚠️ | Dépend vues |
| Reporting | `/reporting` → `src/pages/reporting/Reporting.jsx` | `useReporting.js` | Vues: `v_achats_mensuels`, `v_analytique_stock`, `v_cost_center_month`; fonction: `consolidated_stats` | ⚠️ | Cohérence des vues à valider |
| Dashboard | `/dashboard` → `src/pages/Dashboard.jsx` | `useStats.js`, `useAlerteStockFaible.js` | Vues: `v_alertes_rupture`, `v_stats_globales` | ⚠️ | Gadgets multiples |
| Paramétrage | `/parametrage/utilisateurs`, `/parametrage/roles`, `/parametrage/permissions`, `/parametrage/mamas`, `/parametrage/familles`, `/parametrage/sous-familles` → `src/pages/parametrage/Utilisateurs.jsx`, `src/pages/parametrage/Roles.jsx`, `src/pages/parametrage/Permissions.jsx`, `src/pages/parametrage/Mamas.jsx`, `src/pages/parametrage/Familles.jsx`, `src/pages/parametrage/SousFamilles.jsx` | `useUtilisateurs.js`, `useRoles.js`, `usePermissions.js`, `useMamas.js`, `useFamilles.js`, `useSousFamilles.js` | Tables: `utilisateurs`, `roles`, `permissions`, `mamas`, `familles`, `sous_familles` | ⚠️ | Vérifier droits et RLS |
| Emails envoyés | `/emails/envoyes` → `src/pages/emails/EmailsEnvoyes.jsx` | `useEmailsEnvoyes.js` | Table: `emails_envoyes` | ⚠️ | RLS `emails_envoyes_all` |
| Notifications | `/notifications`, `/notifications/settings` → `src/pages/notifications/NotificationsInbox.jsx`, `src/pages/notifications/NotificationSettingsForm.jsx` | `useNotifications.js` | Tables: `notifications`, `notification_preferences`; fonctions: `send_email_notification`, `send_notification_webhook` | ⚠️ | Vérifier préférences |
| Pages légales | `/confidentialite`, `/mentions-legales`, `/cgu`, `/cgv`, `/contact`, `/licence` → `src/pages/legal/*` | — | Table: `mamas` | ⚠️ | Texte dynamique |

## 3) Front (détails)
### Routes & accès
Routes principales détectées : `/fournisseurs`, `/fournisseurs/nouveau`, `/produits`, `/produits/nouveau`, `/achats`, `/promotions`, `/factures`, `/bons-livraison`, `/inventaire`, `/transferts`, `/commandes`, `/requisitions`, `/taches`, `/fiches`, `/menu`, `/menu/:date`, `/menu-engineering`, `/reporting`, `/dashboard`, `/parametrage/*`, `/emails/envoyes`, `/notifications`, `/notifications/settings`, `/confidentialite`, `/mentions-legales`, `/cgu`, `/cgv`, `/contact`, `/licence`.

### Hooks Supabase
- **useFournisseurs** : `from('fournisseurs').select('*').eq('mama_id', mama_id).order('nom')`
- **useProducts** : `from('produits').select('*, unite:unite_id(nom), ...').eq('mama_id', mama_id)` avec filtres `ilike`, `eq`, `order`, pagination `range`.
- **useAchats** : `from('achats').select("*, fournisseur:fournisseur_id(id, nom), produit:produit_id(id, nom)").eq('mama_id', mama_id)` avec filtres `eq`, `gte/lte` sur `date_achat` et pagination `range`.
- **useFactures** : `from('factures').select("*, fournisseur:fournisseur_id(id, nom)").eq('mama_id', mama_id)` avec filtres `or`, `eq`, `gte/lt` et pagination `range`.
- **useBonsLivraison** : `from('bons_livraison').select("id, numero_bl, date_reception, actif, fournisseur_id, lignes:lignes_bl!bl_id(id)").eq('mama_id', mama_id)`.
- **useInventaires** : `from('inventaires').select("*, zone:inventaire_zones(nom), lignes:produits_inventaire(*, produit:produits(nom, unite_id, pmp))").eq('mama_id', mama_id)`.
- **useCommandes** : `from('commandes').select("*, fournisseur:fournisseur_id(id, nom, email), lignes:commande_lignes(total_ligne)").eq('mama_id', mama_id)`.
- **useTransferts** : `from('transferts').select("id, date_transfert, motif, zone_source:zones_stock!fk_transferts_zone_source_id(id, nom), zone_destination:zones_stock!fk_transferts_zone_dest_id(id, nom), lignes:transfert_lignes(id, produit_id, quantite, produit:produits(id, nom))").eq('mama_id', mama_id)` avec filtres `gte/lte` sur `date_transfert` et `eq` sur `zone_source_id`, `zone_dest_id`, `transfert_lignes.produit_id`.
- **useRequisitions** : `from('requisitions').select("*, lignes:requisition_lignes(produit_id, unite, quantite)").eq('mama_id', mama_id)` et `from('v_requisitions')` avec `ilike` sur `produit_nom`.
- **useTaches** : `from('taches').select('*').eq('mama_id', mama_id)`.
- **useFiches** : `from('fiches_techniques').select("*, famille:familles(id, nom), lignes:fiche_lignes!fiche_id(id)").eq('mama_id', mama_id).order(sortField).range((page-1)*limit, page*limit-1)` avec filtres `ilike`, `eq`.
- **useMenuDuJour** : `from('menus_jour').select("*, fiches:menus_jour_fiches(fiche_id, quantite, fiche:fiches_techniques(id, nom, cout_par_portion))").eq('mama_id', mama_id).order('date', { ascending:false }).range(offset, offset+limit-1)`.
- **useMenuEngineering** : `from('v_me_classification').select('*').eq('mama_id', mama_id)` puis `from('v_menu_du_jour_mensuel').select('food_cost_avg').eq('mama_id', mama_id).eq('mois', month)`.
- **usePromotions** : `from('promotions').select('*', { count:'exact' }).eq('mama_id', mama_id).order('date_debut', { ascending:false })` avec filtres `ilike` sur `nom`, `eq` sur `actif` et pagination `range`.
- **useReporting** : RPC `consolidated_stats` puis `from('v_achats_mensuels').select('*').eq('mama_id', mama_id)`, `from('v_pmp').select('*').eq('mama_id', mama_id)`, `from('v_analytique_stock').select('famille, sumv:valeur').eq('mama_id', mama_id).group('famille')`, `from('v_cost_center_month').select('*').eq('mama_id', mama_id)`.
- **useEmailsEnvoyes** : `from('emails_envoyes').select('*').eq('mama_id', mama_id)` avec filtres `statut`, `email`, `commande_id`, `envoye_le` et pagination `range`.
- **useNotifications** : requêtes multiples sur `notifications` (`select`, `update`, `delete`) et `notification_preferences`, plus RPC `send_email_notification`, `send_notification_webhook`.
- **useUtilisateurs** : `from('utilisateurs_complets').select('*').order('nom').eq('mama_id', mama_id)` puis `from('roles').select('nom, access_rights').eq('id', role_id)`.
- **useRoles** : `from('roles').select('*').order('nom')`.
- **usePermissions** : `from('permissions').select('*').eq('mama_id', mama_id).order('role_id')`.
- **useMamas** : `from('mamas').select('*').order('nom').ilike('nom', "%${search}%").eq('id', mama_id)` selon rôle.
- **useFamilles** : `from('familles').select('id, code, nom, actif', { count:'exact' }).eq('mama_id', mama_id).ilike('nom', "%${search}%").range((page-1)*limit, page*limit-1)`.
- **useSousFamilles** : `from('sous_familles').select('*').eq('mama_id', mama_id).eq('famille_id', familleId).ilike('nom', "%${search}%")`.
- **MentionsLegales.jsx** : `from('mamas').select('mentions_legales').eq('id', mamaId)` avec fallback sur fichier statique.

### Points UX/A11y
Présence de toasts d'erreur et de gestion de chargement, mais doublons `loading` à corriger.

## 4) Back (détails)
- **fournisseurs** : colonnes `id`, `mama_id`, `nom`, `created_at`, `updated_at`, `actif`.
- **produits** : colonnes `id`, `mama_id`, `nom`, `created_at`, `updated_at`, `actif`, `famille_id`, `unite_id`, `code`, `image`.
- **achats** : colonnes `id`, `mama_id`, `produit_id`, `fournisseur_id`, `quantite`, `prix`, `date_achat`, `actif`, `created_at` (policy `achats_all`).
- **promotions** : colonnes `id`, `mama_id`, `nom`, `description`, `date_debut`, `date_fin`, `actif`, `created_at`, `updated_at` (policy `promotions_all`).
- **factures** : schéma actuel limité à `id`, `mama_id`, `created_at`; le front attend `numero`, `date_facture`, `montant`, `statut`.
- **bons_livraison** : schéma actuel limité à `id`, `mama_id`, `created_at`; le front attend `numero_bl`, `date_reception`, `commentaire`, `fournisseur_id`.
- **commandes** : schéma actuel `id`, `mama_id`, `created_at`; le front attend `date_commande`, `statut`, `fournisseur_id`.
- **inventaires** : colonnes `id`, `mama_id`, `date_inventaire`, `zone_id`, `periode_id`, `statut`.
- **requisitions** : colonnes `id`, `mama_id`, `zone_id`, `date_requisition`, `statut`.
- **mamas** : colonnes `id`, `nom`, `created_at`, `updated_at` (policy `mamas_all`).
- **utilisateurs** : colonnes `id`, `nom`, `email`, `auth_id`, `role_id`, `mama_id`, `access_rights`, `actif` (policies `utilisateurs_self_mama`, `utilisateurs_insert_mama`, `utilisateurs_update_mama`).
- **roles** : colonnes `id`, `nom`, `description`, `access_rights`, `actif`, `mama_id` (policies `roles_self_mama`, `roles_insert_mama`, `roles_update_mama`).
- **permissions** : colonnes `id`, `role_id`, `module`, `droit`, `mama_id` (policies `permissions_self_mama`, `permissions_insert_mama`, `permissions_update_mama`).
- **familles** : colonnes `id`, `mama_id`, `nom`, `actif` (policy `familles_all`).
- **sous_familles** : colonnes `id`, `mama_id`, `famille_id`, `nom`, `actif` (policy `sous_familles_all`).
- **transferts** : colonnes `id`, `mama_id`, `date_transfert`, `zone_source_id`, `zone_dest_id`, `motif`, `utilisateur_id`, `created_at`, `updated_at`, `actif` (RLS activée `transferts_all`).
- **transfert_lignes** : colonnes `id`, `transfert_id`, `produit_id`, `quantite`, `commentaire`, `actif`.
- **fiches_techniques** : colonnes `id`, `mama_id`, `nom`, `cout_par_portion`, `famille_id`, `actif`.
- **menus_jour** : colonnes `id`, `mama_id`, `nom`, `date`, `prix_vente_ttc`.
- **emails_envoyes** : colonnes `id`, `commande_id`, `email`, `statut`, `envoye_le`, `mama_id` (policy `emails_envoyes_all`).
- **notifications** : colonnes `id`, `mama_id`, `user_id`, `titre`, `texte`, `lien`, `type`, `lu`, `created_at`, `actif`.
- **notification_preferences** : colonnes `id`, `utilisateur_id`, `mama_id`, `email_enabled`, `webhook_enabled`, `webhook_url`, `webhook_token`, `updated_at`.
- Vues : `v_pmp`, `v_stocks`, `v_products_last_price`, `v_requisitions`, `v_fiche_lignes_complete`, `v_me_classification`, `v_menu_du_jour_mensuel`, `v_achats_mensuels`, `v_analytique_stock`, `v_cost_center_month`, `v_cost_center_monthly` (filtres `mama_id` non toujours explicites).
- Fonctions manquantes : `trg_set_timestamp`, `current_user_is_admin_or_manager`; fonction `consolidated_stats` existante.
- RLS : non vérifiée pour `produits`, `factures`, `bons_livraison`, `commandes`, `inventaires`, `requisitions`, `fiches_techniques`, `menus_jour`.

## 5) Mapping Front↔Back
| Fichier:ligne | Requête | Table/Vue ciblée | Colonnes demandées | Présence SQL | Anomalies |
|--------------|---------|-----------------|-------------------|--------------|-----------|
| `src/hooks/useFournisseurs.js:37-41` | `from('fournisseurs').select('*').eq('mama_id', mama_id).order('nom')` | table:`fournisseurs` | `id`, `nom`, `actif`, `created_at`, `updated_at` | oui | RLS non confirmée |
| `src/hooks/useProducts.js:47-53` | `from('produits').select(...).eq('mama_id', mama_id)` | table:`produits`; vues:`v_pmp`,`v_stocks`,`v_products_last_price` | `*`, `unite.nom`, `famille.nom`, `sous_famille.nom` | partiel | Vues sans `mama_id` explicite |
| `src/hooks/useAchats.js:18-33` | `from('achats').select("*, fournisseur:fournisseur_id(id, nom), produit:produit_id(id, nom)").eq('mama_id', mama_id)` | table:`achats` | `fournisseur_id`, `produit_id`, `quantite`, `prix`, `date_achat`, `actif` | oui | Policy `achats_all` |
| `src/hooks/useFactures.js:31-60` | `from('factures').select("*, fournisseur:fournisseur_id(id, nom)").eq('mama_id', mama_id)` | table:`factures` | `numero`, `date_facture`, `montant`, `statut`, `fournisseur_id` | non | Colonnes manquantes |
| `src/hooks/useBonsLivraison.js:17-26` | `from('bons_livraison').select("id, numero_bl, date_reception, actif, fournisseur_id, lignes:lignes_bl!bl_id(id)").eq('mama_id', mama_id)` | table:`bons_livraison`; join:`lignes_bl` | `numero_bl`, `date_reception`, `fournisseur_id` | non | Colonnes manquantes |
| `src/hooks/useInventaires.js:42-50` | `from('inventaires').select("*, zone:inventaire_zones(nom), lignes:produits_inventaire(*, produit:produits(nom, unite_id, pmp))").eq('mama_id', mama_id)` | table:`inventaires`; joins:`inventaire_zones`, `produits_inventaire` | `date_inventaire`, `zone_id`, `periode_id`, `statut` | partiel | RLS non confirmée |
| `src/hooks/useCommandes.js:18-28` | `from('commandes').select("*, fournisseur:fournisseur_id(id, nom, email), lignes:commande_lignes(total_ligne)").eq('mama_id', mama_id)` | table:`commandes`; join:`commande_lignes` | `date_commande`, `statut`, `fournisseur_id` | non | Colonnes manquantes |
| `src/hooks/useRequisitions.js:31-40` | `from('requisitions').select("*, lignes:requisition_lignes(produit_id, unite, quantite)").eq('mama_id', mama_id)` | table:`requisitions`; join:`requisition_lignes` | `zone_id`, `statut`, `commentaire` | partiel | RLS non confirmée |
| `src/hooks/useFiches.js:18-40` | `from('fiches_techniques').select("*, famille:familles(id, nom), lignes:fiche_lignes!fiche_id(id)").eq('mama_id', mama_id)` | table:`fiches_techniques`; join:`fiche_lignes` | `nom`, `famille_id`, `actif`, `cout_par_portion` | partiel | Vue `v_fiche_lignes_complete` à filtrer |
| `src/hooks/useMenuDuJour.js:18-36` | `from('menus_jour').select("*, fiches:menus_jour_fiches(fiche_id, quantite, fiche:fiches_techniques(id, nom, cout_par_portion))").eq('mama_id', mama_id)` | table:`menus_jour`; join:`menus_jour_fiches` | `nom`, `date`, `prix_vente_ttc` | partiel | Coût calculé côté client |
| `src/hooks/useMenuEngineering.js:13-31` | `from('v_me_classification').select('*').eq('mama_id', mama_id)` | vue:`v_me_classification` | `*` | partiel | Vue dépend d'import ventes |
| `src/hooks/usePromotions.js:17-26` | `from('promotions').select('*', { count:'exact' }).eq('mama_id', mama_id).order('date_debut', { ascending:false })` | table:`promotions` | `nom`, `description`, `date_debut`, `date_fin`, `actif` | oui | Policy `promotions_all` |
| `src/hooks/useReporting.js:31-33` | `from('v_achats_mensuels').select('*').eq('mama_id', mama_id)` | vue:`v_achats_mensuels` | `mama_id`, `mois`, `montant_total` | oui | - |
| `src/hooks/useTransferts.js:27-38` | `from('transferts').select("id, date_transfert, motif, zone_source:zones_stock!fk_transferts_zone_source_id(id, nom), zone_destination:zones_stock!fk_transferts_zone_dest_id(id, nom), lignes:transfert_lignes(id, produit_id, quantite, produit:produits(id, nom))").eq('mama_id', mama_id)` | table:`transferts`; join:`transfert_lignes` | `date_transfert`, `motif`, `zone_source_id`, `zone_dest_id` | oui | Filtres `mama_id` OK |
| `src/pages/Transferts.jsx:229-233` | `from('transferts').select("date_transfert, zone_depart, zone_arrivee, quantite, motif").eq('mama_id', mama_id).eq('produit_id', produit_id)` | table:`transferts` | `date_transfert`, `zone_depart`, `zone_arrivee`, `quantite`, `motif` | non | `zone_depart`/`zone_arrivee` inexistantes |
| `src/hooks/useEmailsEnvoyes.js:10-19` | `from('emails_envoyes').select('*').eq('mama_id', mama_id)...order('envoye_le')` | table:`emails_envoyes` | `email`, `statut`, `commande_id`, `envoye_le` | oui | - |
| `src/hooks/useNotifications.js:58-65` | `from('notifications').select('*').eq('mama_id', mama_id).eq('user_id', user_id).order('created_at', { ascending:false })` | table:`notifications` | `titre`, `texte`, `type`, `lu`, `created_at` | oui | - |
| `src/hooks/useUtilisateurs.js:19-30` | `from('utilisateurs_complets').select('*').eq('mama_id', mama_id).order('nom')` | view:`utilisateurs_complets` | `nom`, `email`, `role_id`, `actif` | oui | - |
| `src/hooks/useRoles.js:10-15` | `from('roles').select('*').order('nom')` | table:`roles` | `nom`, `description`, `access_rights` | oui | - |
| `src/hooks/usePermissions.js:20-24` | `from('permissions').select('*').eq('mama_id', mama_id).order('role_id')` | table:`permissions` | `role_id`, `module`, `droit` | oui | - |
| `src/hooks/useMamas.js:15-23` | `from('mamas').select('*').order('nom').ilike('nom', "%${search}%").eq('id', mama_id)` | table:`mamas` | `nom`, `created_at` | oui | RLS `mamas_all` |
| `src/hooks/useFamilles.js:26-34` | `from('familles').select('id, code, nom, actif', { count:'exact' }).eq('mama_id', mama_id).order('nom').range((params.page-1)*params.limit, params.page*params.limit-1)` | table:`familles` | `id`, `code`, `nom`, `actif` | oui | - |
| `src/hooks/useSousFamilles.js:14-20` | `from('sous_familles').select('*').eq('mama_id', mama_id).eq('famille_id', familleId).ilike('nom', "%${search}%")` | table:`sous_familles` | `nom`, `famille_id`, `actif` | oui | - |
| `src/pages/legal/MentionsLegales.jsx:15-24` | `from('mamas').select('mentions_legales').eq('id', mamaId)` | table:`mamas` | `mentions_legales` | oui | - |

## 6) Erreurs connues
- `Identifier 'loading' has already been declared` dans plusieurs hooks (`useEvolutionAchats`, `useEmailsEnvoyes`, `useZonesStock`).
- Colonnes manquantes provoquant des erreurs 42703 potentielles dans `factures`, `bons_livraison`, `commandes`, `menus_jour`.
- Sélection `zone_depart`/`zone_arrivee` inexistante dans `transferts`.
- Tests unitaires échoués (`backup_db.test.js`, `export_accounting.test.js`, `weekly_report.test.js`).

## 7) Manquants
- Colonnes confirmées manquantes : `fournisseurs.contact`, `produits.pmp`, `produits.stock_theorique`, `factures.numero`, `factures.date_facture`, `factures.montant`, `bons_livraison.numero_bl`, `commandes.date_commande`, `requisitions.zone_id`, `menus_jour.prix_vente_ttc`.
- Colonnes front non trouvées : `transferts.zone_depart`, `transferts.zone_arrivee`.
- Vues à compléter : `v_pmp`, `v_stocks`, `v_products_last_price`, `v_requisitions`, `v_fiche_lignes_complete`, `v_me_classification`, `v_menu_du_jour_mensuel` avec filtre `mama_id` et colonnes attendues.
- Vues à compléter : `v_pmp`, `v_stocks`, `v_products_last_price`, `v_requisitions`, `v_fiche_lignes_complete`, `v_me_classification`, `v_menu_du_jour_mensuel`, `v_achats_mensuels`, `v_analytique_stock`, `v_cost_center_month` avec filtre `mama_id` et colonnes attendues.
- Fonctions/Triggers à créer : `trg_set_timestamp`, `current_user_is_admin_or_manager`.
- Policies RLS : vérifier présence `mama_access_*` pour `fournisseurs`, `produits`, `factures`, `bons_livraison`, `commandes`, `inventaires`, `requisitions`, `fiches_techniques`, `menus_jour`.

## 8) Plan d’action priorisé (Semaine 1)
1. **Front** :
   - Corriger les hooks (`useEvolutionAchats.js`, `useEmailsEnvoyes.js`, `useZonesStock.js`) pour éliminer les doublons `loading`.
   - Harmoniser les hooks `useFactures`, `useBonsLivraison`, `useCommandes`, `useFiches`, `useMenuDuJour` avec les schémas SQL.
   - Vérifier les routes protégées et la Sidebar.
2. **SQL preflight** :
   - `SELECT column_name FROM information_schema.columns WHERE table_name='fournisseurs';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='produits';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='achats';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='factures';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='bons_livraison';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='commandes';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='transferts';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='menus_jour';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='emails_envoyes';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='promotions';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='notifications';`
   - `SELECT column_name FROM information_schema.columns WHERE table_name='notification_preferences';`
3. **SQL patch idempotent** :
   - Ajouter les colonnes listées ci-dessus si absentes.
   - Créer fonctions `trg_set_timestamp`, `current_user_is_admin_or_manager` si manquantes.
   - Compléter vues `v_pmp`, `v_stocks`, `v_products_last_price`, `v_requisitions`, `v_fiche_lignes_complete`, `v_me_classification`, `v_menu_du_jour_mensuel`.
