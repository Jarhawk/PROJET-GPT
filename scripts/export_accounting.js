// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { writeFileSync } from 'fs';
import { getSupabaseClient } from '../src/api/shared/supabaseClient.js';
import { shouldShowHelp } from './cli_utils.js';

export const USAGE =
  'Usage: node scripts/export_accounting.js YYYY-MM [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY]';

function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const lines = [cols.join(',')];
  for (const row of rows) {
    lines.push(cols.map(c => `"${String(row[c] ?? '').replace(/"/g,'""')}"`).join(','));
  }
  return lines.join('\n');
}

export async function exportAccounting(
  month,
  mamaId = process.env.MAMA_ID || null,
  supabaseUrl = null,
  supabaseKey = null
) {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey);
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
  const csv = toCsv(rows);
  const file = `invoices_${m}.csv`;
  writeFileSync(file, csv);
  console.log(`Exported ${rows.length} rows to ${file}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (shouldShowHelp(args)) {
    console.log(USAGE);
    process.exit(0);
  }
  const [monthArg, mamaArg, urlArg, keyArg] = args;
  exportAccounting(monthArg, mamaArg, urlArg, keyArg).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
