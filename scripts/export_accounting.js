// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  runScript,
  isMainModule,
  parseOutputFlag,
  parseMamaIdFlag,
  parseSupabaseFlags,
  parseFormatFlag,
  toCsv,
  ensureDirForFile,
} from './cli_utils.js';

export const USAGE =
  'node scripts/export_accounting.js YYYY-MM [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY] [--output FILE] [--format csv|xlsx|json] [--url URL] [--key KEY]';

function showUsageAndExit0(usage) {
  console.log(`Usage: ${usage}`);
  process.exit(0);
}

function showVersionAndExit0() {
  const pkg = JSON.parse(
    readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), '../package.json'),
      'utf8',
    ),
  );
  console.log(pkg.version);
  process.exit(0);
}

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) showUsageAndExit0(USAGE);
if (argv.includes('--version') || argv.includes('-v')) showVersionAndExit0();


export async function exportAccounting(
  month,
  mamaId = process.env.MAMA_ID || null,
  supabaseUrl = null,
  supabaseKey = null,
  output = null,
  format = process.env.ACCOUNTING_FORMAT || 'csv'
) {
  const { supabase } = await import('@/lib/supabase');
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
  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    let file = output || `invoices_${m}.xlsx`;
    if (!output && process.env.ACCOUNTING_DIR) {
      file = join(process.env.ACCOUNTING_DIR, file);
    }
    ensureDirForFile(file);
    XLSX.writeFile(wb, file);
    console.log(`Exported ${rows.length} rows to ${file}`);
    return file;
  } else if (format === 'json') {
    let file = output || `invoices_${m}.json`;
    if (!output && process.env.ACCOUNTING_DIR) {
      file = join(process.env.ACCOUNTING_DIR, file);
    }
    ensureDirForFile(file);
    writeFileSync(file, JSON.stringify(rows, null, 2));
    console.log(`Exported ${rows.length} rows to ${file}`);
    return file;
  }
  const csv = toCsv(rows);
  let file = output || `invoices_${m}.csv`;
  if (!output && process.env.ACCOUNTING_DIR) {
    file = join(process.env.ACCOUNTING_DIR, file);
  }
  ensureDirForFile(file);
  writeFileSync(file, csv);
  console.log(`Exported ${rows.length} rows to ${file}`);
  return file;
}

if (isMainModule(import.meta.url)) {
  runScript(
    exportAccounting,
    `Usage: ${USAGE}`,
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
