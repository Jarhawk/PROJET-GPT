# Paramétrage Modules

Cette section décrit brièvement les pages de gestion des utilisateurs, rôles, permissions et établissements.

- **Utilisateurs** : recherche, tri, pagination et export Excel. Les actions de modification ou suppression sont filtrées par `mama_id` et réservées aux administrateurs concernés.
- **Rôles** : création et édition des rôles d'un établissement. Les opérations sont restreintes à la `mama_id` courante.
- **Mamas** : gestion des établissements. Seul un `superadmin` peut créer ou supprimer n'importe quel établissement. Les utilisateurs standards ne peuvent éditer que leur propre `mama`.
- **Permissions** : attribution fine des droits par module pour chaque rôle. Les requêtes sont sécurisées par `mama_id`.

Les hooks associés appliquent également ces contraintes afin de compléter les politiques RLS du backend.
