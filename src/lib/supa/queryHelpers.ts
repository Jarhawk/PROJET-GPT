export function normalizeSearch(q?: string) {
  return (q ?? '').trim();
}
export function applySearchOr(req, q) {
  const t = normalizeSearch(q);
  if (!t) return req;
  return req.or(`nom.ilike.%${t}%,code.ilike.%${t}%`);
}
export function applyRange(req, offset=0, limit=50) {
  const from = Math.max(0, offset);
  const to   = Math.max(from, from + Math.max(1, limit) - 1);
  return req.range(from, to);
}
