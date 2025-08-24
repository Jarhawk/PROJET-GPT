import { logSupaError } from './logError';

/**
 * Execute a select query with optional fallback when `stock_projete` column is missing.
 * It recalculates `stock_projete` from other fields if needed.
 *
 * @param {Object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.client
 * @param {string} params.table - table or view name
 * @param {string} params.select - select clause
 * @param {{column: string, ascending: boolean}} [params.order]
 * @param {number} [params.limit]
 * @param {(query: any) => any} [params.filters]
 * @returns {Promise<any[]>}
 */
export async function safeSelectWithFallback({
  client,
  table,
  select,
  order,
  limit,
  filters,
}) {
  let base = client.from(table);
  if (filters) base = filters(base);
  let query = base.select(select);
  if (order) query = query.order(order.column, { ascending: order.ascending });
  if (typeof limit === 'number') query = query.limit(limit);

  let { data, error } = await query;
  if (error && error.code === '42703' && select.includes('stock_projete')) {
    const fallbackSelect = select.replace('stock_projete', 'stock_previsionnel');
    let fallback = base.select(fallbackSelect);
    if (order) fallback = fallback.order(order.column, { ascending: order.ascending });
    if (typeof limit === 'number') fallback = fallback.limit(limit);
    const { data: d2, error: e2 } = await fallback;
    if (e2) {
      logSupaError(table, e2);
      throw e2;
    }
    return (d2 || []).map((r) => ({
      ...r,
      stock_projete:
        r.stock_previsionnel ??
        ((r.stock_actuel ?? 0) + (r.receptions ?? 0) - (r.consommation_prevue ?? 0)),
    }));
  }
  if (error) {
    logSupaError(table, error);
    throw error;
  }
  return data || [];
}
