export const toStr = (v) =>
  v === null || v === undefined ? undefined : String(v);

/**
 * Filtre un tableau d'objets pour n'inclure que ceux ayant une clé "key" non vide.
 * Par défaut, on vérifie "id".
 */
export const validOptions = (arr, key = 'id') =>
  Array.isArray(arr)
    ? arr.filter(
        (o) =>
          o &&
          o[key] !== null &&
          o[key] !== undefined &&
          String(o[key]).trim() !== ''
      )
    : [];
