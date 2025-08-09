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
