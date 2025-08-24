// src/lib/supa/safeSelect.js
export async function safeSelectWithFallback({ client, table, select, order, limit, transform }) {
  // 1er essai : select complet
  let q = client.from(table).select(select);
  if (order) q = q.order(order.column, { ascending: order.ascending === true });
  if (typeof limit === 'number') q = q.limit(limit);

  let { data, error } = await q;
  if (!error) {
    return Array.isArray(transform) || typeof transform === 'function'
      ? (typeof transform === 'function' ? transform(data) : data)
      : data;
  }

  // Si l'erreur vient d'une colonne inconnue (400 PostgREST) on tente sans colonnes "à risque"
  const riskyCols = ['stock_projete']; // on pourra étendre si besoin
  const cleanSelect = select
    .split(',')
    .map(s => s.trim())
    .filter(s => !riskyCols.includes(s) && !riskyCols.some(rc => s.endsWith(`:${rc}`)))
    .join(', ');

  q = client.from(table).select(cleanSelect);
  if (order) q = q.order(order.column, { ascending: order.ascending === true });
  if (typeof limit === 'number') q = q.limit(limit);

  const res2 = await q;
  if (res2.error) {
    // Vue absente / autre erreur -> fallback vide
    return [];
  }

  let rows = res2.data || [];
  // Recalcule stock_projete côté client si pertinent
  if (select.includes('stock_projete')) {
    rows = rows.map(r => ({
      ...r,
      stock_projete:
        r.stock_projete ??
        ((r.stock_actuel ?? 0) + (r.receptions ?? 0) - (r.consommation_prevue ?? 0)),
    }));
  }
  return Array.isArray(transform) || typeof transform === 'function'
    ? (typeof transform === 'function' ? transform(rows) : rows)
    : rows;
}
