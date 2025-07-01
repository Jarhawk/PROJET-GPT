// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import * as XLSX from 'xlsx';
import { getSupabaseClient } from '../src/api/shared/supabaseClient.js';
import { shouldShowHelp } from './cli_utils.js';

export const USAGE =
  'Usage: node scripts/weekly_report.js [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY]';

export async function generateWeeklyCostCenterReport(
  mamaId = process.env.MAMA_ID || null,
  supabaseUrl = null,
  supabaseKey = null,
) {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.rpc('stats_cost_centers', { mama_id_param: mamaId });
  if (error) {
    console.error('Error fetching stats', error);
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stats');
  XLSX.writeFile(wb, 'weekly_cost_centers.xlsx');
  console.log('Report saved to weekly_cost_centers.xlsx');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (shouldShowHelp(args)) {
    console.log(USAGE);
    process.exit(0);
  }
  const [mamaIdArg, urlArg, keyArg] = args;
  generateWeeklyCostCenterReport(mamaIdArg, urlArg, keyArg).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
