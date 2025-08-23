// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import path from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { strict as assert } from 'node:assert';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { runScript, isMainModule } from './cli_utils.js';

function showUsageAndExit0(usage) {
  console.log(`Usage: ${usage}`);
  process.exit(0);
}

function showVersionAndExit0() {
  const pkg = JSON.parse(
    readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), '../package.json'),
      'utf8'
    )
  );
  console.log(pkg.version);
  process.exit(0);
}

const argv = process.argv.slice(2);
const USAGE_TEXT =
  'node scripts/weekly_report.js [--mama-id ID] [--url URL] [--key KEY] [--out FILE] [--start DATE] [--end DATE] [--format xlsx|csv|json]';
if (argv.includes('--help') || argv.includes('-h')) showUsageAndExit0(USAGE_TEXT);
if (argv.includes('--version') || argv.includes('-v')) showVersionAndExit0();

export const USAGE = `Usage: ${USAGE_TEXT}`;

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

