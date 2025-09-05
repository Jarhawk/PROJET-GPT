// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import path from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import * as XLSX from 'xlsx';
import {
  runScript,
  isMainModule,
  shouldShowHelp,
  shouldShowVersion,
  getPackageVersion,
} from './cli_utils.js';
import { supabase } from '@/lib/supa/client';

export const USAGE =
  'Usage: node scripts/weekly_report.js [--mama-id ID] [--url URL] [--key KEY] [--out FILE] [--start DATE] [--end DATE] [--format xlsx|csv|json]';

const argv = process.argv.slice(2);
if (shouldShowHelp(argv)) {
  console.log(USAGE);
  process.exit(0);
}
if (shouldShowVersion(argv)) {
  console.log(getPackageVersion());
  process.exit(0);
}
export async function generateWeeklyCostCenterReport(
  mamaIdArg = null,
  _url = null,
  _key = null,
  start = null,
  end = null,
  outPath = null,
  format = 'xlsx'
) {
  if (start) assert(/^\d{4}-\d{2}-\d{2}$/.test(start), 'Invalid start date format');
  if (end) assert(/^\d{4}-\d{2}-\d{2}$/.test(end), 'Invalid end date format');
  if (start && end) {
    assert(new Date(start) <= new Date(end), 'Start date must be before end date');
  }

  const fmt = (format ?? process.env.WEEKLY_REPORT_FORMAT ?? 'xlsx').toLowerCase();
  assert(['xlsx', 'csv', 'json'].includes(fmt), `Unknown format: ${fmt}`);

  let file;
  if (outPath) {
    file = path.resolve(outPath);
  } else {
    const dirEnv = process.env.REPORT_DIR ?? '.';
    const dir = path.isAbsolute(dirEnv) ? dirEnv : path.resolve(dirEnv);
    file = path.resolve(dir, `weekly_cost_centers.${fmt}`);
  }
  mkdirSync(path.dirname(file), { recursive: true });
  const ext = path.extname(file).toLowerCase();
  if (ext && ext !== `.${fmt}`) {
    throw new Error('Output file extension does not match format');
  }

  const mamaId =
    mamaIdArg ?? process.env.MAMASTOCK_MAMA_ID ?? process.env.MAMA_ID ?? null;
  const { data, error } = await supabase.rpc('stats_cost_centers', {
    mama_id_param: mamaId,
    debut_param: start ?? null,
    fin_param: end ?? null,
  });
  if (error) throw error;
  const rows = data ?? [];

  if (fmt === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'cost_centers');
    XLSX.writeFile(wb, file);
  } else if (fmt === 'csv') {
    const csv = rows.length
      ? [
          Object.keys(rows[0]).join(','),
          ...rows.map((r) =>
            Object.values(r)
              .map((v) => JSON.stringify(v ?? ''))
              .join(',')
          ),
        ].join('\n')
      : '';
    writeFileSync(file, csv);
  } else {
    writeFileSync(file, JSON.stringify(rows, null, 2));
  }
  const shown = file.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '');
  return shown;
}

export function parseArgs(argv) {
  let mamaId;
  let url;
  let key;
  let out;
  let start;
  let end;
  let format;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mama-id') mamaId = argv[++i];
    else if (a.startsWith('--mama-id=')) mamaId = a.split('=')[1];
    else if (a === '--url') url = argv[++i];
    else if (a.startsWith('--url=')) url = a.split('=')[1];
    else if (a === '--key') key = argv[++i];
    else if (a.startsWith('--key=')) key = a.split('=')[1];
    else if (a === '--out') out = argv[++i];
    else if (a.startsWith('--out=')) out = a.split('=')[1];
    else if (a === '--start') start = argv[++i];
    else if (a.startsWith('--start=')) start = a.split('=')[1];
    else if (a === '--end') end = argv[++i];
    else if (a.startsWith('--end=')) end = a.split('=')[1];
    else if (a === '--format') format = argv[++i];
    else if (a.startsWith('--format=')) format = a.split('=')[1];
  }
  return [mamaId, url, key, out, start, end, format];
}

if (isMainModule(import.meta.url)) {
  runScript(
    (mamaId, url, key, out, start, end, format) =>
      generateWeeklyCostCenterReport(mamaId, url, key, start, end, out, format),
    USAGE,
    parseArgs
  );
}

