// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { posix as path } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import {
  runScript,
  isMainModule,
  parseMamaIdFlag,
  parseDateRangeFlags,
  parseOutputFlag,
} from './cli_utils.js';

const SUPA_URL =
  process.env.SUPA_URL ||
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://generic.supabase.co';
const SUPA_KEY =
  process.env.SUPA_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'gen';

const supabase = createClient(SUPA_URL, SUPA_KEY);

export async function generateWeeklyCostCenterReport(
  mamaId = process.env.MAMA_ID ?? null,
  start = null,
  end = null,
  output,
  format
) {
  const fmt = format || process.env.WEEKLY_REPORT_FORMAT || 'xlsx';
  const { data } = await supabase.rpc('stats_cost_centers', {
    mama_id_param: mamaId,
    debut_param: start,
    fin_param: end,
  });

  let out = output;
  if (!out) {
    const base = `weekly_cost_centers.${fmt}`;
    const dir = process.env.REPORT_DIR;
    if (dir) {
      mkdirSync(dir, { recursive: true });
      out = path.join(dir, base);
    } else {
      out = base;
    }
  } else {
    const dir = path.dirname(out);
    if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
  }

  if (fmt === 'csv') {
    writeFileSync(out, '');
  } else if (fmt === 'json') {
    writeFileSync(out, JSON.stringify(data ?? []));
  } else {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data ?? []), 'Report');
    XLSX.writeFile(wb, out);
  }
  return out;
}

export function parseArgs(args) {
  let { args: rest, mamaId } = parseMamaIdFlag(args);
  let start, end, output;
  ({ args: rest, start, end } = parseDateRangeFlags(rest));
  ({ args: rest, output } = parseOutputFlag(rest));
  let format;
  const i = rest.findIndex((a) => a === '--format' || a.startsWith('--format='));
  if (i !== -1) {
    if (rest[i].includes('=')) {
      format = rest[i].split('=')[1];
      rest = rest.slice();
      rest.splice(i, 1);
    } else if (rest[i + 1]) {
      format = rest[i + 1];
      rest = rest.slice();
      rest.splice(i, 2);
    }
  }
  return [mamaId, start, end, output, format];
}

if (isMainModule(import.meta.url)) {
  runScript(generateWeeklyCostCenterReport, 'weekly_report [options]', parseArgs);
}
