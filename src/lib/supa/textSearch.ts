export function normalizeSearchTerm(q?: string) {
  return (q ?? '').trim();
}

export function applyIlikeOr(
  req: import('@supabase/supabase-js').PostgrestFilterBuilder<any, any, any>,
  term: string
) {
  const t = normalizeSearchTerm(term);
  if (!t) return req; // pas de filtre si vide
  return req.or(`nom.ilike.%${t}%,code.ilike.%${t}%`);
}
