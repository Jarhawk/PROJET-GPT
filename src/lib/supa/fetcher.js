export function isAbortError(err) {
  // Supabase v2 renvoie code '20' pour AbortError
  return !!err && (err.name === 'AbortError' || err.code === '20');
}

export function normalizePgRestNoRow(err) {
  // PGRST116 = single JSON demandé mais 0 ligne; on renvoie "null" plutôt qu'une erreur
  return err && err.code === 'PGRST116';
}

export async function run(q) {
  const { data, error } = await q;
  if (error) {
    if (isAbortError(error)) return { data: null, error: null };
    if (normalizePgRestNoRow(error)) return { data: null, error: null };
    return { data: null, error };
  }
  return { data, error: null };
}
