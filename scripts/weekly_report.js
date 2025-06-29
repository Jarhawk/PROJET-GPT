// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

export async function generateWeeklyCostCenterReport() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.rpc('stats_cost_centers', { mama_id_param: null });
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
  generateWeeklyCostCenterReport().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
