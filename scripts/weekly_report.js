// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { posix as path } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { runScript, isMainModule } from './cli_utils.js';

export async function generateWeeklyCostCenterReport(
  mamaIdArg = null,
  url = null,
  key = null,
  start = null,
  end = null,
  outPath = null,
  format = 'xlsx'
) {
  const resolvedUrl =
    url ??
    process.env.SUPA_URL ??
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL;
  const resolvedKey =
    key ??
    process.env.SUPA_KEY ??
    process.env.SUPABASE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;

  assert(resolvedUrl, 'Supabase URL is required');
  assert(/^https?:\/\//.test(resolvedUrl), 'Supabase URL must start with http');
  assert(resolvedKey, 'Supabase key is required');

  if (start) assert(/^\d{4}-\d{2}-\d{2}$/.test(start), 'Invalid start date format');
  if (end) assert(/^\d{4}-\d{2}-\d{2}$/.test(end), 'Invalid end date format');
  if (start && end) {
    assert(new Date(start) <= new Date(end), 'Start date must be before end date');
  }

  const fmt = (format ?? process.env.WEEKLY_REPORT_FORMAT ?? 'xlsx').toLowerCase();
  assert(['xlsx', 'csv', 'json'].includes(fmt), `Unknown format: ${fmt}`);

  let dir;
  let filename;
  if (outPath) {
    dir = path.dirname(outPath);
    filename = path.basename(outPath);
  } else {
    dir = process.env.REPORT_DIR ?? null;
    filename = `weekly_cost_centers.${fmt}`;
  }
  if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
  const full = dir ? path.join(dir, filename) : filename;
  const ext = path.extname(filename).toLowerCase();
  if (ext && ext !== `.${fmt}`) {
    throw new Error('Output file extension does not match format');
  }

  const supa = createClient(resolvedUrl, resolvedKey);
  const mamaId =
    mamaIdArg ?? process.env.MAMA_ID ?? process.env.VITE_MAMA_ID ?? null;
  const { data, error } = await supa.rpc('stats_cost_centers', {
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
    XLSX.writeFile(wb, full);
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
    writeFileSync(full, csv);
  } else {
    writeFileSync(full, JSON.stringify(rows, null, 2));
  }

  return full;
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
    'weekly_report [options]',
    parseArgs
  );
}

