# Post-Consolidation Report

## Modules front corrigés
- Remplacement des accès `mouvements` par `requisition_lignes` ou `v_stocks` dans les hooks principaux (`useStats`, `useDashboard`, `useProducts`, `useTransferts`, `useStock`, `useInventaires`, `useConsoMoyenne`, API stock).
- Suppression des fonctions liées aux mouvements dans `useStock` et `useInventaires`.

## Vues analytiques mises à jour
- `v_stock_requisitionne` – quantités réquisitionnées sur 30 jours.
- `v_produits_utilises` – comptage d'utilisation des produits.
- `v_reco_stockmort` – achats sans utilisation sur 90 jours.
- `v_reco_surcout` – comparaison dernier prix vs PMP.
- `v_tendance_prix_produit` – tendance de prix sur 12 mois.
- `v_top_fournisseurs` – montants d'achats sur 12 mois.
- `v_analytique_stock` – valorisation par famille/sous-famille.
- `v_besoins_previsionnels` – quantités à recommander.
- `v_boissons` – fiches techniques avec coût par portion.
- `v_cost_center_month` et `v_cost_center_monthly` – agrégats achats mensuels.
- `v_performance_fiches` – marge par fiche.

## TODO
- Remplacer les appels restants à `mouvements_centres_cout`.
- Implémenter une vraie logique de calcul pour les mouvements d'inventaire dans `InventaireForm`.
- Compléter les vues de consolidation manquantes listées dans `VERIFY_GAPS.md`.

## Étendre l'analytique ensuite
- Ajouter des paramètres de période aux vues pour affiner les analyses.
- Compléter les vues de cost center dès que les tables associées seront disponibles.
- Optimiser les vues avec des index sur `achats` et `requisitions` pour les champs de date et `produit_id`.

## Ajouts récents
- Création des tables utilitaires : `alertes_rupture`, `logs_activite`, `menus_jour_lignes`, `rapports_generes`, `settings`, `user_mama_access`, `ventes_fiches`, `ventes_import_staging`.
- Ajout de la fonction RPC `log_action` pour tracer les actions utilisateur.
- Ajout des vues de consolidation : `v_cons_achats_mensuels`, `v_cons_ventes_mensuelles`, `v_cons_foodcost_mensuel`, `v_cons_ecarts_inventaire`, `v_consolidation_mensuelle`.
- Ajout des vues menu du jour : `v_menu_du_jour_lignes_cout`, `v_menu_du_jour_resume`, `v_menu_du_jour_mensuel`.
- Vue de classification simplifiée `v_me_classification` pour le module Menu Engineering.

## Patchs front générés
- `patches/useMouvementCostCenters.patch` : remplace les accès `mouvements_centres_cout` par `requisition_lignes`.

## TODO
- Enrichir la vue `v_me_classification` avec des métriques réelles.
- Compléter la logique d'alertes de rupture si nécessaire.

- Tooling stabilized: ESLint 8.57.0 + Vitest jsdom; polyfills added; alias @/* actifs.
- Patched imports & tests; remaining TODOs listés.
