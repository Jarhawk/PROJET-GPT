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

const argv = process.argv.slice(2);
const USAGE_TEXT =
  'node scripts/export_accounting.js YYYY-MM [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY] [--output FILE] [--format csv|xlsx|json] [--url URL] [--key KEY]';
if (shouldShowHelp(argv)) {
  console.log(`Usage: ${USAGE_TEXT}`);
  process.exit(0);
}
if (shouldShowVersion(argv)) {
  console.log(getPackageVersion());
  process.exit(0);
}

export const USAGE = `Usage: ${USAGE_TEXT}`;


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
  const p = path.posix;
  const makeFile = (name) => {
    if (output) {
      ensureDirForFile(output);
      return output;
    }
    const dir = process.env.ACCOUNTING_DIR;
    if (dir) {
      mkdirSync(dir, { recursive: true });
      return p.join(dir, name);
    }
    return name;
  };
  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    const file = makeFile(`invoices_${m}.xlsx`);
    XLSX.writeFile(wb, file);
    console.log(`Exported ${rows.length} rows to ${file}`);
    return file;
  } else if (format === 'json') {
    const file = makeFile(`invoices_${m}.json`);
    writeFileSync(file, JSON.stringify(rows, null, 2));
    console.log(`Exported ${rows.length} rows to ${file}`);
    return file;
  }
  const csv = toCsv(rows);
  const file = makeFile(`invoices_${m}.csv`);
  writeFileSync(file, csv);
  console.log(`Exported ${rows.length} rows to ${file}`);
  return file;
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
