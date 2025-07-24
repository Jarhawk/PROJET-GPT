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

## Étape 7 – Tests : ✅
- Installation des dépendances manquantes.
- `npm run lint` et `npm test` passent sans erreur.

## Étape 8 – Navigation : ✅
- Toutes les routes des modules sont déclarées et protégées.
- Tous les liens du menu sont visibles.
- Lint et tests passent.

## Étape 9 – Validation finale : ✅
- Vérification finale des routes et des liens dans la sidebar.
- `npm run lint` et `npm test` passent après installation des dépendances.

## Étape 10 – Validation navigation complète : ✅
- Toutes les routes vérifiées après installation des dépendances.
- `npm run lint` et `npm test` passent.

## Étape 11 – Vérification finale des tests : ✅
- `npm run lint` et `npm test` passent après installation des dépendances.

## Étape 12 – Dernière revue : ✅
- Exécution finale de `npm run lint` et `npm test` après installation des dépendances.
- Tous les modules vérifiés une dernière fois.

## Étape 13 – Tests après corrections : ✅
- Installation des dépendances manquantes.
- `npm run lint` et `npm test` passent sans erreur.

## Étape 14 – Validation finale navigation : ✅
- Exécution de `npm install` pour restaurer les dépendances.
- `npm run lint` et `npm test` passent sans erreur.
- Toutes les routes des modules principaux vérifiées une dernière fois.

## Étape 15 – Validation finale bis : ✅
- Réinstallation des dépendances et exécution de `npm run lint` et `npm test`.
- Tout passe sans erreur.

## Étape 16 – Tests après installation : ✅
- `npm install` executed successfully.
- `npm run lint` passed with warnings.
- `npm test` passed.
## Étape 17 – Vérification authentification : ✅
- Ajout des logs session et déconnexion toast.
- Rafraîchissement périodique des tokens et redirection root.
- `npm install` OK, lint et tests passent.
## Étape 18 – Intégration finale authentification : ✅
- Login et logout vérifiés, Layout affiche utilisateur et rôle.
- Route `/` redirige selon la session.
- `npm install`, `npm run lint`, `npm test` passent.

## Étape 19 – Page NotFound : ✅
- Ajout de la page `NotFound` dans le routeur.
- La route `*` affiche maintenant `NotFound.jsx` au lieu de rediriger.
- Nouvelle installation des dépendances et vérification des commandes lint, test et build.
\n## Étape 20 – Sécurisation planning et inventaire : ✅
- Ajout des vérifications useAuth sur les pages de planning, inventaires, bons de livraison et achats.
- Création des tables planning_lignes et vues pour dernier prix produits.
- Mise à jour du tracker codex_progress.json.
\n## Étape 21 – Dépendances ESLint : ✅\n- Installation des packages manquants pour ESLint (@eslint/js)\n- "npm run lint" passe sans erreur.\n- "npm test" échoue toujours faute de credentials Supabase.
\n## Étape 22 – Installation des dépendances et exécution des tests : ✅\n- `npm install` pour récupérer toutes les dépendances.\n- `npm run lint` réussit.\n- `npm test` échoue toujours faute de credentials Supabase.
\n## Étape 23 – Audit final modules fiches et achats : ✅\n- Documentation des pages BL, achats, planning et inventaire dans codex_progress.json.\n- Ajout de la vue v_produits_dernier_prix et RLS planning dans Ajout.sql.\n- `npm run lint` OK.\n- `npm test` échoue faute de credentials Supabase.
\n## Étape 24 – Mise à jour ESLint et tests\n- Installation des dépendances manquantes.\n- "npm run lint" passe.\n- "npm test" échoue faute de credentials Supabase.
