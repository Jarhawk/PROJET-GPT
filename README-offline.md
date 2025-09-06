# Mode hors ligne

- Sélection du dossier data depuis la page **Paramètres**.
- Chemin par défaut: `%USERPROFILE%/MamaStock/data`. Le choix est enregistré dans `%APPDATA%/MamaStock/config.json`.
- La base SQLite est ouverte dans ce dossier ; si elle est absente, les migrations présentes dans `public/migrations` sont appliquées.
- Un verrou distribué (`db.lock.json`) utilise un TTL de 20s et un heartbeat de 5s pour empêcher l'accès concurrent.
- Les requêtes d'arrêt sont émises via `shutdown.request.json` et provoquent la fermeture automatique de l'instance active.
- Le bouton **Quitter & synchroniser** ferme proprement la base et libère le verrou.
- Le script `npm run icon:gen` génère les icônes Tauri à partir de `assets/logo.svg` avant la compilation.
