# Verification Report

## Files Modified
- `src/utils/numberFR.js`
- `src/dev/schemaIntrospect.ts`
- `src/layout/Sidebar.jsx`
- `src/lib/supabase.js`
- `src/hooks/data/useProduits.js`
- `src/components/gadgets/GadgetTopFournisseurs.jsx`
- `test/useTopFournisseurs.hook.test.jsx`
- `src/hooks/useFactureForm.js`
- `test/Layout.test.jsx`
- `test/produits.flow.test.jsx`

## Query Adjustments & Aliases
- Provided helper `assertSelect` to warn and alias missing columns.
- `useProduits` pré-charge le schéma en dev, filtre par `mama_id` et construit la sélection via `assertSelect`, incluant la jointure `sous_famille:sous_familles(id, nom, famille_id, famille:familles(id, nom))` avec `eq('sous_famille.famille_id', ...)`.
- GadgetTopFournisseurs utilise `formatEUR` et sécurise les données retournées (`Array.isArray`).
- Mise à jour du test `useTopFournisseurs` pour refléter la vue `v_top_fournisseurs` et injecter `QueryClientProvider`.
- `useFactureForm` centralise le parsing décimal via `toNumberSafeFR`.
- Mise à jour des tests de layout pour refléter la barre latérale persistante.
- Ajout d'un test d'intégration `produits.flow` simulant la création, la modification et la suppression d'un produit via un client Supabase mocké.

## Tests
- `npm test` – échecs (plusieurs suites échouent, voir logs)

No front-end multi-request merges were added in this change.
