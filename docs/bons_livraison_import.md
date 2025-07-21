# Import Bons de Livraison

Ce module permet de créer un bon de livraison depuis un fichier Excel.

## Modèle attendu

| numero_bl | date_reception | fournisseur_id | produit_id | quantite_recue | prix_unitaire | tva | commentaire |
|-----------|----------------|----------------|------------|----------------|---------------|-----|-------------|

Chaque ligne correspond à un produit livré. Le fichier doit être encodé en UTF-8.

1. `numero_bl` : numéro du bon de livraison
2. `date_reception` : date de réception au format `YYYY-MM-DD`
3. `fournisseur_id` : identifiant du fournisseur
4. `produit_id` : identifiant du produit (créé au besoin)
5. `quantite_recue` : quantité reçue
6. `prix_unitaire` : prix unitaire HT
7. `tva` : taux de TVA appliqué
8. `commentaire` : texte libre optionnel

Le fichier peut contenir plusieurs bons pour un même fournisseur. Les produits inexistants seront créés automatiquement.
