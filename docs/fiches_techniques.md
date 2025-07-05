# Module Fiches Techniques

Ce module permet de gérer les fiches de production :

- liste paginée avec recherche et export (Excel ou PDF)
- formulaire d'ajout/édition des fiches et de leurs lignes
- détail complet avec historique de coût et export

## Fichiers principaux
- `src/pages/fiches/Fiches.jsx`
- `src/pages/fiches/FicheForm.jsx`
- `src/pages/fiches/FicheDetail.jsx`
- `src/hooks/useFiches.js`
- `src/hooks/useFicheCoutHistory.js`
- `src/hooks/useProduitsAutocomplete.js`
- `src/hooks/useFichesAutocomplete.js`

Les données sont sécurisées par RLS avec le `mama_id` dans `db/full_setup.sql`.
Des triggers (`refresh_fiche_cost`) calculent automatiquement `cout_total` et `cout_par_portion` (voir `db/full_setup.sql`).

Le formulaire permet d'ajouter des lignes de type produit ou sous-fiche via les hooks d'autocomplétion. Le ratio matière est affiché quand un prix de vente HT est renseigné.

## Reprise
Pour reprendre le développement :
1. Utiliser `useFiches` pour les opérations CRUD.
2. Les exports PDF/Excel sont gérés côté client via `jspdf` et `xlsx`.
3. Les tests unitaires se lancent avec `npm test`.
