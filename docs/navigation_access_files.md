# Fichiers de Navigation et Droits

Les composants et contextes gérant la navigation et les droits d'accès se trouvent principalement dans `src/` :

- `src/router.jsx` : configuration globale des routes et redirections.
- `src/context/AuthContext.jsx` : contexte d'authentification fournissant session, rôle et `access_rights`.
- `src/components/ProtectedRoute.jsx` : wrapper contrôlant l'accès aux routes selon la clé fournie.
- `src/layout/Sidebar.jsx` : menu latéral affichant les liens en fonction des `access_rights`.
- `src/layout/Layout.jsx` : agencement général des pages protégées avec barre latérale.
- `src/components/layout/Sidebar.jsx` : ancienne version de la sidebar utilisée par `AdminLayout`.
- `src/lib/modules.js` : liste centralisée des modules. Les formulaires de rôles et de permissions réutilisent ces clés pour rester cohérents.

Les tests liés se trouvent dans `test/router.test.jsx`.
