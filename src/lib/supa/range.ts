export function applyRange(
  req: import('@supabase/supabase-js').PostgrestFilterBuilder<any, any, any>,
  offset = 0,
  limit = 50
) {
  const from = Math.max(0, Number(offset) || 0);
  const l = Math.max(1, Number(limit) || 1);
  const to = Math.max(from, from + l - 1);
  return req.range(from, to);
}
