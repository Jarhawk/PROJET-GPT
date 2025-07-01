// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { getSupabaseClient } from '../src/api/shared/supabaseClient.js';
import { shouldShowHelp } from './cli_utils.js';

export const USAGE =
  'Usage: node scripts/reallocate_history.js [LIMIT] [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY]';

export async function reallocateHistory(
  limit = 100,
  mamaId = process.env.MAMA_ID || null,
  supabaseUrl = null,
  supabaseKey = null
) {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey);

  const { data: mouvements, error } = await supabase.rpc(
    'mouvements_without_alloc',
    { limit_param: limit }
  );
  if (error) {
    console.error('Error fetching movements', error);
    return;
  }

  const filtered = (mouvements || []).filter(
    (m) => !mamaId || m.mama_id === mamaId
  );

  for (const m of filtered) {
    const { data: suggestions } = await supabase.rpc('suggest_cost_centers', { p_produit_id: m.produit_id });
    for (const s of suggestions || []) {
      await supabase.from('mouvements_centres_cout').insert({
        mouvement_id: m.id,
        cost_center_id: s.cost_center_id,
        quantite: Math.round(Math.abs(m.quantite) * Number(s.ratio) * 100) / 100,
        valeur: m.valeur ? Math.round(Math.abs(m.valeur) * Number(s.ratio) * 100) / 100 : null,
        mama_id: m.mama_id,
      });
    }
    console.log(`Allocated movement ${m.id}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (shouldShowHelp(args)) {
    console.log(USAGE);
    process.exit(0);
  }
  const [limitArg, mamaIdArg, urlArg, keyArg] = args;
  const limit = Number(limitArg) || 100;
  reallocateHistory(limit, mamaIdArg, urlArg, keyArg).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
