// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import {
  runScript,
  isMainModule,
  parseOutputFlag,
  parseMamaIdFlag,
  parseSupabaseFlags,
  parseFormatFlag,
  toCsv,
  ensureDirForFile,
  shouldShowHelp,
  shouldShowVersion,
  getPackageVersion,
} from './cli_utils.js';

export const USAGE =
  'Usage: node scripts/export_accounting.js YYYY-MM [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY] [--output FILE] [--format csv|xlsx|json] [--url URL] [--key KEY]';

const argv = process.argv.slice(2);
if (shouldShowHelp(argv)) {
  console.log(USAGE);
  process.exit(0);
}
if (shouldShowVersion(argv)) {
  console.log(getPackageVersion());
  process.exit(0);
}
export async function exportAccounting(
  month,
  mamaId = process.env.MAMA_ID || null,
  supabaseUrl = null,
  supabaseKey = null,
  output = null,
  format = process.env.ACCOUNTING_FORMAT || 'csv'
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
  const mama_id = mamaId;
  const m = month || new Date().toISOString().slice(0,7);
  const start = `${m}-01`;
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  const endStr = end.toISOString().slice(0,10);
  let query = supabase
    .from('facture_lignes')
    .select('quantite, prix_unitaire, total, factures(id,date,fournisseur_id)');
  if (mama_id) query = query.eq('mama_id', mama_id);
  query = query.gte('factures.date', start).lt('factures.date', endStr);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data || []).map(r => ({
    facture_id: r.factures?.id,
    date: r.factures?.date,
    fournisseur_id: r.factures?.fournisseur_id,
    quantite: r.quantite,
    prix_unitaire: r.prix_unitaire,
    total: r.total,
  }));
  const makeFile = (name) => {
    if (output) {
      const real = path.resolve(output);
      ensureDirForFile(real);
      return real;
    }
    const dirEnv = process.env.ACCOUNTING_DIR;
    if (dirEnv) {
      const dir = path.isAbsolute(dirEnv) ? dirEnv : path.resolve(dirEnv);
      mkdirSync(dir, { recursive: true });
      return path.resolve(dir, name);
    }
    return path.resolve(name);
  };
  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    const file = makeFile(`invoices_${m}.xlsx`);
    XLSX.writeFile(wb, file);
    const shown = file.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '');
    console.log(`Exported ${rows.length} rows to ${shown}`);
    return shown;
  } else if (format === 'json') {
    const file = makeFile(`invoices_${m}.json`);
    writeFileSync(file, JSON.stringify(rows, null, 2));
    const shown = file.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '');
    console.log(`Exported ${rows.length} rows to ${shown}`);
    return shown;
  }
  const csv = toCsv(rows);
  const file = makeFile(`invoices_${m}.csv`);
  writeFileSync(file, csv);
  const shown = file.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '');
  console.log(`Exported ${rows.length} rows to ${shown}`);
  return shown;
}

if (isMainModule(import.meta.url)) {
  runScript(
    exportAccounting,
    USAGE,
    (args) => {
      const out = parseOutputFlag(args);
      args = out.args;
      const id = parseMamaIdFlag(args);
      args = id.args;
      const fmt = parseFormatFlag(args);
      args = fmt.args;
      const creds = parseSupabaseFlags(args);
      args = creds.args;
      return [args[0], id.mamaId ?? args[1], creds.url ?? args[2], creds.key ?? args[3], out.output, fmt.format];
    }
  );
}
