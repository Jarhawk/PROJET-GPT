# Audit des liaisons inter-modules MamaStock

Ce document récapitule l'état des références `produit_id` et des mises à jour automatiques pour chaque module métier.

## Factures / facture_lignes
- `facture_lignes` utilise `produit_id` (référence à `produits`).
- Les entrées doivent déclencher les mouvements de stock et mettre à jour le PMP.
- **Back**: trigger `trg_apply_stock_facture` ajouté dans `db/ajout.sql`.
- **Front**: vérifier que `useInvoices` recharge les stocks et le prix moyen après création.

## Fiches techniques / fiches_lignes
- Manque d'un trigger pour recalculer le stock théorique lors de la suppression/ajout de lignes.
- **Back**: TODO dans `db/ajout.sql` pour ajouter triggers sur `fiches_lignes`.
- **Front**: le hook `useFiches` doit rafraîchir les données produit après édition.

## Stock mouvements
- `stock_mouvements` centralise les variations avec `produit_id` cohérent.
- Vérifier que toutes les écritures passent par cette table.

## Inventaires / lignes_inventaire
- `inventaire_lignes` contient `produit_id` ; la vue `v_ecarts_inventaire` expose les écarts.
- Manquent des triggers pour appliquer systématiquement les ajustements de stock.
- **Back**: TODO dans `db/ajout.sql`.
- **Front**: `useInventaires` doit invalider le cache stock après clôture.

## Transferts / transfert_lignes
- `transfert_lignes` utilise `produit_id` avec trigger `insert_stock_from_transfert_ligne` (ok).
- S'assurer que la suppression inverse bien le mouvement.

## Bons de livraison
- `lignes_bl` gère `produit_id` et l'insertion de BL déclenche maintenant `apply_stock_from_achat`.
- **Front**: `useBonLivraison` (à créer si absent) doit rafraîchir les stocks.

## Synthèse produits
- Nom, unité, famille, PMP et stock sont cohérents via les fonctions `update_product_pmp` et `update_stock_theorique`.
- Vérifier que les hooks `useProducts` et `useStock` rechargent les données après chaque opération.

## Actions restantes
- Compléter les TODO de `db/ajout.sql` pour couvrir les suppressions et les modules fiche/inventaire.
- Ajouter des tests de bout en bout pour valider les enchaînements factures → stock → PMP.
