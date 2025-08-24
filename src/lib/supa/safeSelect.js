import { logSupaError } from './logError';

/**
 * Execute a `select` on a table or view and gracefully fallback when it is
 * missing. This prevents runtime errors when optional views are not yet
 * created on the database.
 *
 * @param {Object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.client - Supabase client
 * @param {string} params.table - Table or view name
 * @param {string} params.select - Select clause
 * @param {(query: any) => any} [params.query] - Optional function to further
 *   customize the query (e.g. add filters)
 * @returns {Promise<Array>} Retrieved rows or an empty array if the relation
 *   does not exist.
 */
export const safeSelectWithFallback = async ({
  client,
  table,
  select,
  query,
}) => {
  try {
    let req = client.from(table).select(select);
    if (typeof query === 'function') {
      req = query(req);
    }
    const { data, error } = await req;
    if (error) throw error;
    return data;
  } catch (error) {
    // 42P01 => undefined_table
    if (error?.code === '42P01') {
      if (import.meta.env.DEV) {
        console.warn(`Relation "${table}" is missing, returning empty array.`);
      }
      return [];
    }
    logSupaError(`select ${table}`, error);
    throw error;
  }
};

