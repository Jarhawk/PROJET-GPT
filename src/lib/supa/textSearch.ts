// fix: avoid ilike.%% on empty search.
export function normalizeSearchTerm(q?: string) {
  return (q ?? '').trim();
}

// For supabase-js v2 (SDK)
export function applyIlikeOr(
  req: import('@supabase/supabase-js').PostgrestFilterBuilder<any, any, any>,
  term: string
) {
  const t = normalizeSearchTerm(term);
  if (!t) return req; // do not add filter when empty
  // Supabase-js encodes params automatically; we use % wildcards directly
  return req.or(`nom.ilike.%${t}%,code.ilike.%${t}%`);
}
