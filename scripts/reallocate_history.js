// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import {
  runScript,
  isMainModule,
  parseDryRunFlag,
  parseLimitFlag,
  parseMamaIdFlag,
  parseSupabaseFlags,
  shouldShowHelp,
  shouldShowVersion,
  getPackageVersion,
} from './cli_utils.js';

export const USAGE =
  'Usage: node scripts/reallocate_history.js [LIMIT] [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY] [--limit N] [--dry-run] [--url URL] [--key KEY]';

const argv = process.argv.slice(2);
if (shouldShowHelp(argv)) {
  console.log(USAGE);
  process.exit(0);
}
if (shouldShowVersion(argv)) {
  console.log(getPackageVersion());
  process.exit(0);
}
export async function reallocateHistory(
  limit = (() => {
    const val = Number(process.env.REALLOCATE_LIMIT);
    return Number.isFinite(val) && val > 0 ? val : 100;
  })(),
  mamaId = process.env.MAMA_ID || null,
  supabaseUrl = null,
  supabaseKey = null,
  dryRun = false
) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    supabaseUrl ?? process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? 'https://example.supabase.co',
    supabaseKey ??
      process.env.VITE_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      process.env.SUPABASE_KEY ??
      'key'
  );

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
      const record = {
        mouvement_id: m.id,
        cost_center_id: s.cost_center_id,
        quantite: Math.round(Math.abs(m.quantite) * Number(s.ratio) * 100) / 100,
        valeur: m.valeur ? Math.round(Math.abs(m.valeur) * Number(s.ratio) * 100) / 100 : null,
        mama_id: m.mama_id,
      };
      if (dryRun) {
        console.log('Would allocate', record);
      } else {
        await supabase.from('mouvements_centres_cout').insert(record);
      }
    }
    if (!dryRun) {
      console.log(`Allocated movement ${m.id}`);
    }
  }
}

if (isMainModule(import.meta.url)) {
  runScript(
    reallocateHistory,
    USAGE,
    (args) => {
      const limitOpt = parseLimitFlag(args);
      args = limitOpt.args;
      const dry = parseDryRunFlag(args);
      args = dry.args;
      const id = parseMamaIdFlag(args);
      args = id.args;
      const creds = parseSupabaseFlags(args);
      args = creds.args;
      const pos = (() => {
        const v = Number(args[0]);
        return Number.isFinite(v) && v > 0 ? v : undefined;
      })();
      const env = (() => {
        const v = Number(process.env.REALLOCATE_LIMIT);
        return Number.isFinite(v) && v > 0 ? v : undefined;
      })();
      const limit = limitOpt.limit ?? pos ?? env ?? 100;
      return [
        limit,
        id.mamaId ?? args[1],
        creds.url ?? args[2],
        creds.key ?? args[3],
        dry.dryRun,
      ];
    }
  );
}
