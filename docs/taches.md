# Gestion des tâches

Ce module permet de planifier des tâches internes avec échéance manuelle ou calculée à partir d'un délai. Les tâches peuvent être récurrentes et assignées à plusieurs utilisateurs.

## Hook `useTaches`

```javascript
const { taches, getTaches, createTache, updateTache, deleteTache } = useTaches();
```

- `getTaches({ statut, priorite, assigne, start, end })` filtre par période, statut, priorité ou assigné.
- `createTache(values)` et `updateTache(id, values)` calculent automatiquement `date_echeance` si `delai_jours` est fourni.

## Formulaire

`TacheForm` gère dynamiquement le délai ou la date d'échéance ainsi que la récurrence.

## Sécurité

Toutes les requêtes sont protégées par `mama_id`. Les modifications sont limitées au créateur ou aux utilisateurs assignés.
