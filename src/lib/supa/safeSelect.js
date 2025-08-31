// src/lib/supa/safeSelect.js
export async function safeSelectWithFallback({ client, table, select, order, limit, transform }) {
  // 1er essai : select complet
  let q = client.from(table).select(select);
  if (order) q = q.order(order.column, { ascending: order.ascending === true });
  if (typeof limit === 'number') q = q.limit(limit);

  const { data, error } = await q;
  if (!error) {
    const rows = Array.isArray(data) ? data : [];
    return typeof transform === 'function' ? transform(rows) : rows;
  }

  // Si l'erreur vient d'une colonne inconnue (400 PostgREST) on tente sans colonnes "à risque"
  const riskyCols = ['stock_projete']; // on pourra étendre si besoin
  const parts = select.split(',');
  const keep = [];
  for (const raw of parts) {
    const s = raw.trim();
    let isRisky = false;
    for (const rc of riskyCols) {
      if (s === rc || s.endsWith(`:${rc}`)) {
        isRisky = true;
        break;
      }
    }
    if (!isRisky) keep.push(s);
  }
  const cleanSelect = keep.join(', ');

  q = client.from(table).select(cleanSelect);
  if (order) q = q.order(order.column, { ascending: order.ascending === true });
  if (typeof limit === 'number') q = q.limit(limit);

  const res2 = await q;
  if (res2.error) {
    // Vue absente / autre erreur -> fallback vide
    return [];
  }
  let rows = Array.isArray(res2.data) ? res2.data : [];
  // Recalcule stock_projete côté client si pertinent
  if (select.includes('stock_projete')) {
    const recalculated = [];
    for (const r of rows) {
      recalculated.push({
        ...r,
        stock_projete:
          r.stock_projete ??
          ((r.stock_actuel ?? 0) + (r.receptions ?? 0) - (r.consommation_prevue ?? 0)),
      });
    }
    rows = recalculated;
  }
  return typeof transform === 'function' ? transform(rows) : rows;
}
