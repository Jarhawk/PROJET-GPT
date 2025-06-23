# Audit du module Factures pour export comptable

Ce document synthétise l'analyse du schéma SQL et du code existant afin de garantir la bonne préparation des données avant export vers un ERP.

## Tables concernées

### `factures`
- Colonnes existantes : `id`, `reference`, `date`, `fournisseur_id`, `montant`, `statut`, `justificatif`, `mama_id`, `created_at`.
- Aucune colonne `total_ht`, `total_tva` ou `total_ttc` n'est définie.
- Le champ `statut` n'est pas contraint (`check`) dans le schéma actuel.

### `facture_lignes`
- Colonnes : `id`, `facture_id`, `product_id`, `quantite`, `prix_unitaire`, `total` (généré), `mama_id`, `created_at`.
- Pas de champ `tva` ni `taux_tva`.
- Les triggers `trg_facture_total` et `trg_facture_ligne` mettent à jour le montant total de la facture et le PMP des produits.

## Conformité aux exigences d'export

Les colonnes nécessaires pour un export comptable complet ne sont pas toutes présentes. Il manque notamment :
- Les montants hors taxes et TTC ainsi que la TVA calculée.
- Les valeurs par défaut pour la TVA sur les lignes de facture.
- Une contrainte sur `statut` pour limiter les valeurs à `brouillon`, `validée`, `payée`.

## Instructions SQL recommandées

```sql
-- Ajout des totaux et TVA sur la table factures
alter table factures
  add column if not exists total_ht numeric,
  add column if not exists total_tva numeric,
  add column if not exists total_ttc numeric;

-- Ajout du champ TVA sur les lignes avec valeur par défaut 20%
alter table facture_lignes
  add column if not exists tva numeric default 20;

-- Contrainte de statut autorisé
alter table factures
  add constraint if not exists chk_factures_statut
  check (statut in ('brouillon','validée','payée'));
```

Après création de ces colonnes, adapter le trigger `refresh_facture_total` pour renseigner `total_ht`, `total_tva` et `total_ttc`.

## Colonnes obligatoires pour l'export

| Table            | Colonne            | Type      | Remarques                                    |
|------------------|--------------------|-----------|----------------------------------------------|
| factures         | id                 | uuid      | identifiant unique                           |
| factures         | date               | date      | toujours présent                             |
| factures         | fournisseur_id     | uuid      | `references fournisseurs(id)`                |
| factures         | total_ht           | numeric   | montant hors taxes                           |
| factures         | total_tva          | numeric   | montant de TVA                               |
| factures         | total_ttc          | numeric   | montant TTC                                  |
| factures         | statut             | text      | `brouillon`, `validée`, `payée`              |
| factures         | mama_id            | uuid      | identifiant établissement                    |
| factures         | created_at         | timestamptz | timestamp de création                       |
| facture_lignes   | product_id         | uuid      | produit acheté                               |
| facture_lignes   | quantite           | numeric   | quantité                                     |
| facture_lignes   | prix_unitaire      | numeric   | prix unitaire HT                             |
| facture_lignes   | tva                | numeric   | taux de TVA (10 ou 20 % par défaut)          |
| facture_lignes   | mama_id            | uuid      | identifiant établissement                    |

## Vue ou endpoint d'export

Une vue SQL simplifie la récupération des écritures comptables par période et par fournisseur :

```sql
create or replace view v_export_compta as
select
  f.date,
  f.fournisseur_id,
  fl.product_id,
  fl.quantite,
  fl.prix_unitaire,
  fl.tva,
  (fl.quantite * fl.prix_unitaire) as montant_ht,
  (fl.quantite * fl.prix_unitaire * fl.tva/100) as montant_tva,
  (fl.quantite * fl.prix_unitaire * (1 + fl.tva/100)) as montant_ttc
from facture_lignes fl
  join factures f on f.id = fl.facture_id
where f.date between $1 and $2
  and (f.fournisseur_id = $3 or $3 is null);
```

Cette vue permet ensuite de générer un fichier `journal-achat-XXXX.csv` depuis le code (voir `useExportCompta`).

## Conclusion

Le module Factures nécessite l'ajout de colonnes pour stocker les montants HT/TVA/TTC ainsi qu'un champ `tva` sur les lignes. Ces ajustements, combinés à la vue `v_export_compta`, garantiront la cohérence des données pour l'export vers un ERP.
