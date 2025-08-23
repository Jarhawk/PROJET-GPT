// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  runScript,
  isMainModule,
  parseDryRunFlag,
  parseLimitFlag,
  parseMamaIdFlag,
  parseSupabaseFlags,
} from './cli_utils.js';

function showUsageAndExit0(usage) {
  console.log(`Usage: ${usage}`);
  process.exit(0);
}

function showVersionAndExit0() {
  const pkg = JSON.parse(
    readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), '../package.json'),
      'utf8'
    )
  );
  console.log(pkg.version);
  process.exit(0);
}

const argv = process.argv.slice(2);
const USAGE_TEXT =
  'node scripts/reallocate_history.js [LIMIT] [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY] [--limit N] [--dry-run] [--url URL] [--key KEY]';
if (argv.includes('--help') || argv.includes('-h')) showUsageAndExit0(USAGE_TEXT);
if (argv.includes('--version') || argv.includes('-v')) showVersionAndExit0();

export const USAGE = `Usage: ${USAGE_TEXT}`;

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
