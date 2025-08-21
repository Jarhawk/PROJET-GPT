let cachedSource = null;

/**
 * Determine the source relation for stock alerts.
 * Returns 'alertes_rupture' if it exposes stock_actuel or
 * 'v_alertes_rupture_compat' otherwise.
 * The decision is memoized for subsequent calls.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function resolveAlertesRuptureSource(supabase) {
  if (cachedSource) return cachedSource;
  const { error } = await supabase
    .from('alertes_rupture')
    .select('id, stock_actuel')
    .limit(1);
  if (error) {
    if (error.code === '42703') {
      cachedSource = 'v_alertes_rupture_compat';
      return cachedSource;
    }
    throw error;
  }
  cachedSource = 'alertes_rupture';
  return cachedSource;
}
