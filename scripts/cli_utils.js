// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { fileURLToPath } from 'url';
import { resolve, dirname, join, relative, isAbsolute } from 'path';
import { readFileSync, existsSync, mkdirSync } from 'fs';

export function loadEnvFile(file, override = false) {
  const text = readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let [, key, value] = match;
    if (value.startsWith('"') || value.startsWith("'")) {
      const quote = value[0];
      const end = value.indexOf(quote, 1);
      if (end !== -1) {
        let after = value.slice(end + 1).trim();
        if (after.startsWith('#')) after = '';
        value = value.slice(1, end) + after;
      } else {
        value = value.slice(1);
      }
    } else {
      const hash = value.indexOf('#');
      if (hash !== -1) value = value.slice(0, hash).trim();
    }
    if (override || !(key in process.env)) {
      value = value.replace(/\\?\$(?:{([^}]+)}|([A-Za-z0-9_]+))/g, (m, braced, plain) => {
        if (m.startsWith('\\$')) return m.slice(1);
        const name = braced || plain;
        return process.env[name] ?? '';
      });
      process.env[key] = value;
    }
  }
}

export function isMainModule(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  return resolve(argv1) === fileURLToPath(metaUrl);
}

export function shouldShowHelp(args) {
  return args.some((a) => a === '--help' || a === '-h');
}

export function shouldShowVersion(args) {
  return args.some((a) => a === '--version' || a === '-v');
}

export function getPackageVersion() {
  const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
  return JSON.parse(readFileSync(pkgPath, 'utf8')).version;
}

export function parseOutputFlag(args) {
  let output;
  let i = args.findIndex((a) => a === '--output' || a.startsWith('--output='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      output = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      output = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  i = args.findIndex((a) => a === '-o' || a.startsWith('-o='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      output = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      output = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  return { args, output };
}

export function parseDateRangeFlags(args) {
  let start;
  let end;
  let i = args.findIndex((a) => a === '--start' || a.startsWith('--start='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      start = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      start = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  i = args.findIndex((a) => a === '--end' || a.startsWith('--end='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      end = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      end = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  return { args, start, end };
}

export function parseMamaIdFlag(args) {
  let mamaId;
  let i = args.findIndex((a) => a === '--mama-id' || a.startsWith('--mama-id='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      mamaId = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      mamaId = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  i = args.findIndex((a) => a === '-m' || a.startsWith('-m='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      mamaId = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      mamaId = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  return { args, mamaId };
}

export function parseSupabaseFlags(args) {
  let url;
  let key;
  let i = args.findIndex((a) => a === '--url' || a.startsWith('--url='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      url = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      url = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  i = args.findIndex((a) => a === '--key' || a.startsWith('--key='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      key = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      key = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  i = args.findIndex((a) => a === '-u' || a.startsWith('-u='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      url = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      url = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  i = args.findIndex((a) => a === '-k' || a.startsWith('-k='));
  if (i !== -1) {
    if (args[i].includes('=')) {
      key = args[i].split('=')[1];
      args = args.slice();
      args.splice(i, 1);
    } else if (args[i + 1]) {
      key = args[i + 1];
      args = args.slice();
      args.splice(i, 2);
    }
  }
  return { args, url, key };
}

export function parseDryRunFlag(args) {
  let dryRun = false;
  const long = args.indexOf('--dry-run');
  if (long !== -1) {
    dryRun = true;
    args = args.slice();
    args.splice(long, 1);
  }
  const short = args.indexOf('-d');
  if (short !== -1) {
    dryRun = true;
    args = args.slice();
    args.splice(short, 1);
  }
  return { args, dryRun };
}

export function parseLimitFlag(args) {
  let limit;
  let i = args.findIndex((a) => a === '--limit' || a.startsWith('--limit='));
  if (i !== -1) {
    const val = args[i].includes('=') ? args[i].split('=')[1] : args[i + 1];
    const num = Number(val);
    if (Number.isFinite(num) && num > 0) limit = num;
    args = args.slice();
    args.splice(i, args[i].includes('=') ? 1 : 2);
  }
  i = args.findIndex((a) => a === '-l' || a.startsWith('-l='));
  if (i !== -1) {
    const val = args[i].includes('=') ? args[i].split('=')[1] : args[i + 1];
    const num = Number(val);
    if (Number.isFinite(num) && num > 0) limit = num;
    args = args.slice();
    args.splice(i, args[i].includes('=') ? 1 : 2);
  }
  return { args, limit };
}

export function parseTablesFlag(args) {
  let tables;
  let i = args.findIndex((a) => a === '--tables' || a.startsWith('--tables='));
  if (i !== -1) {
    const val = args[i].includes('=') ? args[i].split('=')[1] : args[i + 1];
    if (val) {
      const list = val.split(',').map((t) => t.trim()).filter(Boolean);
      const seen = new Set();
      tables = [];
      for (const name of list) {
        if (!seen.has(name)) {
          seen.add(name);
          tables.push(name);
        }
      }
    }
    args = args.slice();
    args.splice(i, args[i].includes('=') ? 1 : 2);
  }
  i = args.findIndex((a) => a === '-t' || a.startsWith('-t='));
  if (i !== -1) {
    const val = args[i].includes('=') ? args[i].split('=')[1] : args[i + 1];
    if (val) {
      const list = val.split(',').map((t) => t.trim()).filter(Boolean);
      const seen = new Set();
      tables = [];
      for (const name of list) {
        if (!seen.has(name)) {
          seen.add(name);
          tables.push(name);
        }
      }
    }
    args = args.slice();
    args.splice(i, args[i].includes('=') ? 1 : 2);
  }
  return { args, tables };
}

export function parseGzipFlag(args) {
  let gzip = false;
  let i = args.findIndex(
    (a) => a === '--gzip' || a.startsWith('--gzip=')
  );
  if (i !== -1) {
    gzip = true;
    args = args.slice();
    args.splice(i, 1);
  }
  i = args.findIndex((a) => a === '-z' || a.startsWith('-z='));
  if (i !== -1) {
    gzip = true;
    args = args.slice();
    args.splice(i, 1);
  }
  return { args, gzip };
}

export function parsePrettyFlag(args) {
  let pretty = false;
  let i = args.findIndex(
    (a) => a === '--pretty' || a.startsWith('--pretty=')
  );
  if (i !== -1) {
    pretty = true;
    args = args.slice();
    args.splice(i, 1);
  }
  i = args.findIndex((a) => a === '-p' || a.startsWith('-p='));
  if (i !== -1) {
    pretty = true;
    args = args.slice();
    args.splice(i, 1);
  }
  return { args, pretty };
}

export function parseConcurrencyFlag(args) {
  let concurrency;
  let i = args.findIndex(
    (a) => a === '--concurrency' || a.startsWith('--concurrency=')
  );
  if (i !== -1) {
    const val = args[i].includes('=') ? args[i].split('=')[1] : args[i + 1];
    const num = Number(val);
    if (Number.isFinite(num) && num > 0) concurrency = num;
    args = args.slice();
    args.splice(i, args[i].includes('=') ? 1 : 2);
  }
  i = args.findIndex((a) => a === '-c' || a.startsWith('-c='));
  if (i !== -1) {
    const val = args[i].includes('=') ? args[i].split('=')[1] : args[i + 1];
    const num = Number(val);
    if (Number.isFinite(num) && num > 0) concurrency = num;
    args = args.slice();
    args.splice(i, args[i].includes('=') ? 1 : 2);
  }
  return { args, concurrency };
}

export function parseFormatFlag(args) {
  let format;
  let i = args.findIndex((a) => a === '--format' || a.startsWith('--format='));
  if (i !== -1) {
    format = args[i].includes('=') ? args[i].split('=')[1] : args[i + 1];
    args = args.slice();
    args.splice(i, args[i].includes('=') ? 1 : 2);
  }
  i = args.findIndex((a) => a === '-f' || a.startsWith('-f='));
  if (i !== -1) {
    format = args[i].includes('=') ? args[i].split('=')[1] : args[i + 1];
    args = args.slice();
    args.splice(i, args[i].includes('=') ? 1 : 2);
  }
  if (format && !['csv', 'xlsx', 'json'].includes(format)) {
    format = undefined;
  }
  return { args, format };
}

export function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const lines = [cols.join(',')];
  for (const row of rows) {
    lines.push(
      cols
        .map((c) => `"${String(row[c] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
  }
  return lines.join('\n');
}

export function ensureDirForFile(file) {
  const dir = dirname(resolve(file));
  mkdirSync(dir, { recursive: true });
}

export function formatShownPath(file) {
  const norm = file.replace(/\\/g, '/');
  if (!isAbsolute(file)) return norm;
  const rel = relative(process.cwd(), file).replace(/\\/g, '/');
  return rel.startsWith('..') ? norm : rel;
}

export function runScript(
  main,
  usage,
  parseArgs = (args) => args,
  args = process.argv.slice(2),
  scriptPath = process.argv[1],
) {
  if (shouldShowHelp(args)) {
    console.log(usage);
    process.exit(0);
    return;
  }
  if (shouldShowVersion(args)) {
    console.log(getPackageVersion());
    process.exit(0);
    return;
  }
  const envIndex = args.findIndex((a) => a === '--env-file' || a === '-e');
  if (envIndex !== -1 && args[envIndex + 1]) {
    loadEnvFile(args[envIndex + 1]);
    args = args.slice();
    args.splice(envIndex, 2);
  } else {
    if (process.env.ENV_FILE && existsSync(process.env.ENV_FILE)) {
      loadEnvFile(process.env.ENV_FILE);
    }
    const searchDirs = [process.cwd(), dirname(resolve(scriptPath))];
    for (const dir of searchDirs) {
      const env = join(dir, '.env');
      if (existsSync(env)) loadEnvFile(env);
      const local = join(dir, '.env.local');
      if (existsSync(local)) loadEnvFile(local, true);
    }
  }
  const params = parseArgs(args);
  return Promise.resolve(main(...params)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

