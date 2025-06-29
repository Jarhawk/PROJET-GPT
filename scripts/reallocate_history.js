// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { createClient } from '@supabase/supabase-js';

export async function reallocateHistory(limit = 100) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: mouvements, error } = await supabase.rpc('mouvements_without_alloc', { limit_param: limit });
  if (error) {
    console.error('Error fetching movements', error);
    return;
  }

  for (const m of mouvements || []) {
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
  reallocateHistory().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
