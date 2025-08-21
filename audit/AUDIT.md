# Audit routes & navigation

## Routes déclarées
(116 routes)

- /
- /*
- /accueil
- /achats
- /admin/access-multi-sites
- /aide
- /alertes
- /analyse
- /analyse/analytique
- /analyse/cost-centers
- /blocked
- /bons-livraison
- /bons-livraison/:id
- /bons-livraison/nouveau
- /carte
- /catalogue/sync
- /cgu
- /cgv
- /commandes
- /commandes/:id
- /commandes/envoyees
- /commandes/nouvelle
- /comparatif
- /confidentialite
- /consentements
- /consolidation
- /contact
- /costing/carte
- /create-mama
- /dashboard
- /dashboard/builder
- /debug/access
- /debug/auth
- /debug/rights
- /documents
- /emails/envoyes
- /engineering
- /factures
- /factures/:id
- /factures/import
- /factures/new
- /feedback
- /fiches
- /fiches/:id
- /fournisseurs
- /fournisseurs/:id
- /fournisseurs/:id/api
- /fournisseurs/nouveau
- /inventaire
- /inventaire/:id
- /inventaire/new
- /inventaire/zones
- /licence
- /login
- /logout
- /mentions-legales
- /menu
- /menu-engineering
- /menu-groupes
- /menu-groupes/:id
- /menu-groupes/nouveau
- /menu/:date
- /menus
- /notifications
- /notifications/settings
- /onboarding
- /onboarding-utilisateur
- /parametrage/access
- /parametrage/api-fournisseurs
- /parametrage/api-keys
- /parametrage/familles
- /parametrage/mamas
- /parametrage/periodes
- /parametrage/permissions
- /parametrage/roles
- /parametrage/settings
- /parametrage/sous-familles
- /parametrage/unites
- /parametrage/utilisateurs
- /parametrage/zones
- /parametrage/zones/:id
- /parametrage/zones/:id/droits
- /pending
- /planning
- /planning-module
- /planning/:id
- /planning/nouveau
- /planning/simulation
- /produits
- /produits/:id
- /produits/nouveau
- /promotions
- /receptions
- /recettes
- /reporting
- /requisitions
- /requisitions/:id
- /requisitions/nouvelle
- /reset-password
- /rgpd
- /signup
- /stats
- /stock/alertes
- /supervision
- /supervision/comparateur
- /supervision/logs
- /supervision/rapports
- /surcouts
- /tableaux-de-bord
- /taches
- /taches/:id
- /taches/alertes
- /taches/new
- /transferts
- /unauthorized
- /update-password

## Liens de menu
(28 liens)

- /aide
- /alertes
- /analyse
- /comparatif
- /costing/carte
- /dashboard
- /debug/auth
- /documents
- /engineering
- /factures
- /feedback
- /fiches
- /fournisseurs
- /inventaire
- /menu
- /menu-engineering
- /menus
- /notifications
- /onboarding
- /parametrage/familles
- /parametrage/sous-familles
- /parametrage/unites
- /produits
- /promotions
- /receptions
- /recettes
- /surcouts
- /tableaux-de-bord

## Correspondances
- Aucun lien de menu sans route correspondante.
- Routes non liées dans les menus : nombreuses pages (authentification, formulaires d'ajout/édition, paramètres détaillés, etc.) comme `/login`, `/factures/new`, `/achats`, `/menu-groupes/nouveau`, `/commandes`, `/planning/simulation`, etc.

## module_page_report.json
Les modules manquants ont été ajoutés :
- `costing_carte` → `costing/CostingCarte.jsx`
- `emails_envoyes` → `emails/EmailsEnvoyes.jsx`
- `menu_du_jour` → `menu/MenuDuJour.jsx`, `menu/MenuDuJourJour.jsx`
- `menu_groupe` → `menus/MenuGroupes.jsx`, `menus/MenuGroupeForm.jsx`, `menus/MenuGroupeDetail.jsx`

## Requêtes Supabase
- Aucun `from('v_alertes_rupture')` avec embed `produit:produit_id(...)` trouvé.
- Aucun filtre `traite` sur `v_alertes_rupture` trouvé.
- Utilisation directe de la table `alertes_rupture` dans `useRuptureAlerts.js` (update de traitement).
- Références à `v_stock_theorique` dans les fonctions Supabase (ex. `generatePurchaseSuggestions`).

## FactureForm & lignes produit
- Les champs numériques utilisent le composant `NumericInput` (type texte tolérant `,`/`.`).
- `PU HT` et `PMP` sont en lecture seule, même style que `Unité`.
- Lors de la sélection d’un produit :
  - TVA `p.tva`
  - Zone via `zone_stock_id` (renommé `zone_id`)
  - Unité via `useProduitLineDefaults` (`unites.nom`)
  - PMP récupéré depuis `v_pmp` (historique `facture_lignes`).

## ProduitSearchModal & recherche produit
- `useProduitsSearch` sélectionne `id, nom, unite_id, tva, zone_stock_id` et renvoie ces valeurs.
- `ProduitSearchModal` transmet les données au parent mais remplace `zone_id` par `prod.zone_stock_id`, qui peut être `null` après normalisation.

## useFournisseursAutocomplete
- Le fichier `src/hooks/useFournisseursAutocomplete.js` exporte bien `useFournisseursAutocomplete` et `searchFournisseurs`.

## À corriger
- [ ] Remplacer l’usage direct de la table `alertes_rupture` par la vue `v_alertes_rupture` pour les mises à jour.
- [ ] Vérifier la propagation de `zone_stock_id` dans `ProduitSearchModal` afin de ne pas écraser `zone_id`.
- [ ] (Optionnel) Relier les routes non présentes dans les menus ou supprimer les routes obsolètes si nécessaire.
