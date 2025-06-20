# Progression Codex – Design Liquid Glass MamaStock

## Étape 1 – Préparation : ✅
- Ajout du fichier `globals.css` avec styles globaux et utilitaire `text-shadow`.
- Mise à jour de `tailwind.config.cjs` pour inclure `globals.css` et nouvelle utilité.

## Étape 2 – Composants UI : ✅
- Création des composants `Card.jsx`, `Button.jsx`, `Input.jsx` et `TableContainer.jsx` dans `src/components/ui/`.

## Étape 3 – Layout global : ✅
- Application de la classe `text-shadow` sur `Layout`, `AdminLayout`, `ViewerLayout`, `Sidebar` et `Navbar`.
- Import de `globals.css` dans `main.jsx`.

## Étape 4 – Pages produits : ✅
- Conversion de `Produits.jsx` pour utiliser `TableContainer` et les styles Glass.
- Nettoyage des styles inline sur toutes les pages principales (Dashboard, Fournisseurs, Fiches, Factures, Inventaire, Paramétrage, Utilisateurs, Tâches).
- Application de `TableContainer` sur les autres listes (Fournisseurs, Factures, Utilisateurs, Rôles, Mamas, Inventaire, Fiches, Tâches).

## Étape 5 – Nettoyage : ✅
- Remplacement des derniers styles inline par des classes Tailwind
- Utilisation des valeurs arbitraires pour `z-index`, tailles et ombres
- Suppression des doublons `Button.jsx`, `Input.jsx` et `Card.jsx` en faveur des
  versions existantes en minuscules

## Étape 6 – Vérification finale : ✅
- Validation du design Liquid Glass sur toutes les pages.
- Lint, tests et serveur de développement impossibles car dépendances manquantes (`vite`, `@eslint/js`, `vitest`).
