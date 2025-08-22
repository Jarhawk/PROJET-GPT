// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { posix as path } from 'path';
import { supabase } from '@/lib/supabase';
import {
  runScript,
  isMainModule,
  parseOutputFlag,
  parseDateRangeFlags,
  parseMamaIdFlag,
  parseSupabaseFlags,
  parseFormatFlag,
  toCsv,
  ensureDirForFile,
} from './cli_utils.js';

export const USAGE =
  'Usage: node scripts/weekly_report.js [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY] [--start YYYY-MM-DD] [--end YYYY-MM-DD] [--output FILE] [--format csv|xlsx|json] [--url URL] [--key KEY]';

export async function generateWeeklyCostCenterReport(
  mamaId = process.env.MAMA_ID || null,
  start = null,
  end = null,
  output = 'weekly_cost_centers.xlsx',
  format = process.env.WEEKLY_REPORT_FORMAT || 'xlsx',
) {
  const { data, error } = await supabase.rpc('stats_cost_centers', {
    mama_id_param: mamaId,
    debut_param: start,
    fin_param: end,
  });
  if (error) {
    console.error('Error fetching stats', error);
    return;
  }
  const rows = data || [];
  if (format === 'csv') {
    let file = output || 'weekly_cost_centers.csv';
    if (!output && process.env.REPORT_DIR) {
      file = path.join(process.env.REPORT_DIR, file);
    }
    ensureDirForFile(file);
    writeFileSync(file, toCsv(rows));
    console.log(`Report saved to ${file}`);
    return file;
  } else if (format === 'json') {
    let file = output || 'weekly_cost_centers.json';
    if (!output && process.env.REPORT_DIR) {
      file = path.join(process.env.REPORT_DIR, file);
    }
    ensureDirForFile(file);
    writeFileSync(file, JSON.stringify(rows, null, 2));
    console.log(`Report saved to ${file}`);
    return file;
  } else {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stats');
    let file = output || 'weekly_cost_centers.xlsx';
    if (!output && process.env.REPORT_DIR) {
      file = path.join(process.env.REPORT_DIR, file);
    }
    ensureDirForFile(file);
    XLSX.writeFile(wb, file);
    console.log(`Report saved to ${file}`);
    return file;
  }
}

if (isMainModule(import.meta.url)) {
  runScript(
    generateWeeklyCostCenterReport,
    USAGE,
    (args) => {
      const range = parseDateRangeFlags(args);
      args = range.args;
      const result = parseOutputFlag(args);
      args = result.args;
      const fmt = parseFormatFlag(args);
      args = fmt.args;
      const id = parseMamaIdFlag(args);
      args = id.args;
      const creds = parseSupabaseFlags(args);
      args = creds.args;
      return [
        id.mamaId ?? args[0],
        range.start,
        range.end,
        result.output,
        fmt.format,
      ];
    }
  );
}
