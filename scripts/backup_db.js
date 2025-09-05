// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'zlib';
import {
  runScript,
  isMainModule,
  parseOutputFlag,
  parseMamaIdFlag,
  parseSupabaseFlags,
  parseTablesFlag,
  parseGzipFlag,
  parsePrettyFlag,
  parseConcurrencyFlag,
  ensureDirForFile,
  shouldShowHelp,
  shouldShowVersion,
  getPackageVersion,
} from './cli_utils.js';
import { supabase } from '@/lib/supa/client';

export const USAGE =
  'Usage: node scripts/backup_db.js [FILE] [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY] [--tables list] [--output FILE] [--gzip] [--pretty] [--concurrency N] [--url URL] [--key KEY]';

const argv = process.argv.slice(2);
if (shouldShowHelp(argv)) {
  console.log(USAGE);
  process.exit(0);
}
if (shouldShowVersion(argv)) {
  console.log(getPackageVersion());
  process.exit(0);
}

export async function backupDb(
  output = null,
  mamaId = process.env.MAMA_ID || null,
  _supabaseUrl = null,
  _supabaseKey = null,
  tables = null,
  gzip = process.env.BACKUP_GZIP === 'true' || process.env.BACKUP_GZIP === '1',
  pretty =
    process.env.BACKUP_PRETTY === 'true' || process.env.BACKUP_PRETTY === '1'
  ,
  concurrency = (() => {
    const val = Number(process.env.BACKUP_CONCURRENCY);
    return Number.isFinite(val) && val > 0 ? val : Infinity;
  })()
) {
  if (!Number.isFinite(concurrency) || concurrency <= 0) concurrency = Infinity;
  const mama_id = mamaId;
  const defaultTables = process.env.BACKUP_TABLES
    ? process.env.BACKUP_TABLES.split(',').map((t) => t.trim()).filter(Boolean)
    : [
        'produits',
        'fournisseurs',
        'factures',
        'facture_lignes',
        'inventaires',
        'produits_inventaire',
        'fournisseur_produits',
        'taches',
        'tache_instances',
        'mouvements_centres_cout',
      ];
  const list = tables || defaultTables;
  const entries = [];
  for (let i = 0; i < list.length; i += concurrency) {
    const chunk = list.slice(i, i + concurrency);
    const res = await Promise.all(
      chunk.map(async (table) => {
        let query = supabase.from(table).select('*');
        if (mama_id) query = query.eq('mama_id', mama_id);
        const { data, error } = await query;
        if (error) throw error;
        return [table, data];
      })
    );
    entries.push(...res);
  }
  const result = Object.fromEntries(entries);
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const defName = gzip ? `backup_${stamp}.json.gz` : `backup_${stamp}.json`;
  let file;
  if (output) {
    file = path.resolve(output);
    ensureDirForFile(file);
  } else {
    let dir = process.env.BACKUP_DIR ?? '/tmp';
    dir = path.isAbsolute(dir) ? dir : path.resolve(dir);
    mkdirSync(dir, { recursive: true });
    file = path.resolve(dir, defName);
  }
  const data = JSON.stringify(result, null, pretty ? 2 : 0);
  if (gzip) {
    writeFileSync(file, gzipSync(data));
  } else {
    writeFileSync(file, data);
  }
  const shown = file.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '');
  console.log(`Backup saved to ${shown}`);
  return shown;
}

if (isMainModule(import.meta.url)) {
  runScript(
    backupDb,
    USAGE,
    (args) => {
      const out = parseOutputFlag(args);
      args = out.args;
      const id = parseMamaIdFlag(args);
      args = id.args;
      const tables = parseTablesFlag(args);
      args = tables.args;
      const gz = parseGzipFlag(args);
      args = gz.args;
      const prettyFlag = parsePrettyFlag(args);
      args = prettyFlag.args;
      const conc = parseConcurrencyFlag(args);
      args = conc.args;
      const creds = parseSupabaseFlags(args);
      args = creds.args;
      let output = out.output;
      if (!output && args.length && !args[0].startsWith('-')) {
        output = args.shift();
      }
      let mamaId = id.mamaId;
      if (!mamaId && args.length && !args[0].startsWith('-')) {
        mamaId = args.shift();
      }
      return [
        output,
        mamaId,
        creds.url ?? args[0],
        creds.key ?? args[1],
        tables.tables,
        gz.gzip,
        prettyFlag.pretty,
        conc.concurrency,
      ];
    }
  );
}
