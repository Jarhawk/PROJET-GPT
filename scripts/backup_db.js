// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { writeFileSync } from 'fs';
import { getSupabaseClient } from '../src/api/shared/supabaseClient.js';
import { shouldShowHelp } from './cli_utils.js';

export const USAGE =
  'Usage: node scripts/backup_db.js [FILE] [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY]';

export async function backupDb(
  output = null,
  mamaId = process.env.MAMA_ID || null,
  supabaseUrl = null,
  supabaseKey = null
) {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey);
  const mama_id = mamaId;
  const tables = [
    'produits',
    'fournisseurs',
    'factures',
    'facture_lignes',
    'inventaires',
    'inventaire_lignes',
    'fournisseur_produits',
    'taches',
    'tache_instances',
    'mouvements_stock'
  ];
  const result = {};
  for (const table of tables) {
    let query = supabase.from(table).select('*');
    if (mama_id) query = query.eq('mama_id', mama_id);
    const { data, error } = await query;
    if (error) throw error;
    result[table] = data;
  }
  const stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const file = output || `backup_${stamp}.json`;
  writeFileSync(file, JSON.stringify(result, null, 2));
  console.log(`Backup saved to ${file}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (shouldShowHelp(args)) {
    console.log(USAGE);
    process.exit(0);
  }
  const [outputArg, mamaIdArg, urlArg, keyArg] = args;
  backupDb(outputArg, mamaIdArg, urlArg, keyArg).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
