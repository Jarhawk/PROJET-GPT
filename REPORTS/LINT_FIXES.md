# Lint fixes

## Fichiers modifiés
- `src/pages/surcouts/Surcouts.jsx` : suppression de l'import React inutilisé.
- `src/router.jsx` : suppression de l'import `NotFound` inutilisé.
- `src/components/LiquidBackground/BubblesParticles.jsx` : suppression de l'import React inutilisé.
- `src/components/LiquidBackground/LiquidBackground.jsx` : suppression de l'import React inutilisé.
- `src/components/LiquidBackground/WavesBackground.jsx` : suppression de l'import React inutilisé.

## Règles encore en *warn*
- `react-hooks/exhaustive-deps` : de nombreuses dépendances manquantes dans `useEffect` nécessitent une revue fonctionnelle.
- `no-unused-vars` : quelques variables non utilisées subsistent (ex. `Button`).

## TODO / Refactors
- Vérifier les dépendances des hooks pour éviter les effets oubliés.
- Nettoyer les imports inutilisés restants, notamment les composants ou helpers non utilisés.
