import { describe, it, expect, vi } from 'vitest';
import {
  loadEnvFile,
  shouldShowHelp,
  shouldShowVersion,
  getPackageVersion,
  runScript,
  isMainModule,
  parseOutputFlag,
  parseDateRangeFlags,
  parseDryRunFlag,
  parseLimitFlag,
  parseTablesFlag,
  parseGzipFlag,
  parsePrettyFlag,
  parseConcurrencyFlag,
  parseSupabaseFlags,
  parseMamaIdFlag,
  parseFormatFlag,
  toCsv,
} from '../scripts/cli_utils.js';

describe('loadEnvFile', () => {
  it('loads variables from a file', async () => {
    const { writeFileSync, unlinkSync } = await import('fs');
    const path = 'tmp-env';
    writeFileSync(path, 'FOO=bar');
    loadEnvFile(path);
    expect(process.env.FOO).toBe('bar');
    delete process.env.FOO;
    unlinkSync(path);
  });

  it('overrides only when requested', async () => {
    const { writeFileSync, unlinkSync } = await import('fs');
    const path = 'tmp-env2';
    writeFileSync(path, 'OVERRIDE=yes');
    process.env.OVERRIDE = 'no';
    loadEnvFile(path);
    expect(process.env.OVERRIDE).toBe('no');
    loadEnvFile(path, true);
    expect(process.env.OVERRIDE).toBe('yes');
    delete process.env.OVERRIDE;
    unlinkSync(path);
  });

  it('supports export and quotes', async () => {
    const { writeFileSync, unlinkSync } = await import('fs');
    const path = 'tmp-env3';
    writeFileSync(
      path,
      "export QUOTED='a b'#comment\nDOUBLE=\"x y\"\nUNQUOTED=val #c\n"
    );
    loadEnvFile(path);
    expect(process.env.QUOTED).toBe('a b');
    expect(process.env.DOUBLE).toBe('x y');
    expect(process.env.UNQUOTED).toBe('val');
    delete process.env.QUOTED;
    delete process.env.DOUBLE;
    delete process.env.UNQUOTED;
    unlinkSync(path);
  });

  it('expands referenced variables', async () => {
    const { writeFileSync, unlinkSync } = await import('fs');
    const path = 'tmp-env4';
    process.env.BASE = 'hello';
    writeFileSync(path, 'GREETING=$BASE world\nFULL=${BASE}!');
    loadEnvFile(path);
    expect(process.env.GREETING).toBe('hello world');
    expect(process.env.FULL).toBe('hello!');
    delete process.env.GREETING;
    delete process.env.FULL;
    delete process.env.BASE;
    unlinkSync(path);
  });
});

describe('shouldShowHelp', () => {
  it('detects help flags anywhere', () => {
    expect(shouldShowHelp(['--help'])).toBe(true);
    expect(shouldShowHelp(['foo', '--help', 'bar'])).toBe(true);
    expect(shouldShowHelp(['-h'])).toBe(true);
    expect(shouldShowHelp(['foo', '-h'])).toBe(true);
  });

  it('returns false when no flag present', () => {
    expect(shouldShowHelp(['foo'])).toBe(false);
  });
});

describe('shouldShowVersion', () => {
  it('detects version flags anywhere', () => {
    expect(shouldShowVersion(['--version'])).toBe(true);
    expect(shouldShowVersion(['foo', '--version'])).toBe(true);
    expect(shouldShowVersion(['-v'])).toBe(true);
  });

  it('returns false when no flag present', () => {
    expect(shouldShowVersion(['foo'])).toBe(false);
  });
});

describe('runScript', () => {
  it('prints usage and exits on help', async () => {
    const log = vi.fn();
    const exit = vi.fn();
    const origLog = console.log;
    const origExit = process.exit;
    console.log = log;
    process.exit = exit;
    await runScript(() => {}, 'Usage: test', undefined, ['--help']);
    expect(log).toHaveBeenCalledWith('Usage: test');
    expect(exit).toHaveBeenCalledWith(0);
    console.log = origLog;
    process.exit = origExit;
  });

  it('prints version and exits when requested', async () => {
    const log = vi.fn();
    const exit = vi.fn();
    const origLog = console.log;
    const origExit = process.exit;
    console.log = log;
    process.exit = exit;
    await runScript(() => {}, 'Usage: test', undefined, ['--version']);
    expect(log).toHaveBeenCalledWith(getPackageVersion());
    expect(exit).toHaveBeenCalledWith(0);
    console.log = origLog;
    process.exit = origExit;
  });

  it('passes parsed args to the main function', async () => {
    const main = vi.fn();
    await runScript(main, 'usage', (args) => [args[0]], ['foo']);
    expect(main).toHaveBeenCalledWith('foo');
  });

  it('loads environment variables from a file', async () => {
    const { writeFileSync, unlinkSync } = await import('fs');
    const envPath = 'test-env-file';
    writeFileSync(envPath, 'FOO=bar');
    const main = vi.fn(() => {
      expect(process.env.FOO).toBe('bar');
    });
    await runScript(main, 'usage', undefined, ['--env-file', envPath]);
    delete process.env.FOO;
    unlinkSync(envPath);
  });

  it('loads .env automatically when present', async () => {
    const { writeFileSync, unlinkSync } = await import('fs');
    writeFileSync('.env', 'AUTO=on');
    const main = vi.fn(() => {
      expect(process.env.AUTO).toBe('on');
    });
    await runScript(main, 'usage', undefined, []);
    delete process.env.AUTO;
    unlinkSync('.env');
  });

  it('loads .env.local after .env when present', async () => {
    const { writeFileSync, unlinkSync } = await import('fs');
    writeFileSync('.env', 'AUTO=on\nLOCAL=off');
    writeFileSync('.env.local', 'LOCAL=on');
    const main = vi.fn(() => {
      expect(process.env.AUTO).toBe('on');
      expect(process.env.LOCAL).toBe('on');
    });
    await runScript(main, 'usage', undefined, []);
    delete process.env.AUTO;
    delete process.env.LOCAL;
    unlinkSync('.env');
    unlinkSync('.env.local');
  });

  it('loads env file from ENV_FILE variable', async () => {
    const { writeFileSync, unlinkSync } = await import('fs');
    const envPath = 'custom-env';
    writeFileSync(envPath, 'FROM_VAR=yes');
    process.env.ENV_FILE = envPath;
    const main = vi.fn(() => {
      expect(process.env.FROM_VAR).toBe('yes');
    });
    await runScript(main, 'usage', undefined, []);
    delete process.env.FROM_VAR;
    delete process.env.ENV_FILE;
    unlinkSync(envPath);
  });

  it('loads env files relative to script path', async () => {
    const { writeFileSync, mkdtempSync, rmSync } = await import('fs');
    const { tmpdir } = await import('os');
    const { join } = await import('path');
    const dir = mkdtempSync(join(tmpdir(), 'script-'));
    writeFileSync(join(dir, '.env'), 'FROM_SCRIPT=yes');
    const main = vi.fn(() => {
      expect(process.env.FROM_SCRIPT).toBe('yes');
    });
    await runScript(main, 'usage', undefined, [], join(dir, 'dummy.js'));
    delete process.env.FROM_SCRIPT;
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('parseOutputFlag', () => {
  it('extracts --output flag', () => {
    const { args, output } = parseOutputFlag([
      '--output',
      'file.txt',
      'rest',
    ]);
    expect(output).toBe('file.txt');
    expect(args).toEqual(['rest']);
  });

  it('supports -o shorthand', () => {
    const { args, output } = parseOutputFlag(['-o', 'out.csv']);
    expect(output).toBe('out.csv');
    expect(args).toEqual([]);
  });

  it('supports --output=value', () => {
    const { args, output } = parseOutputFlag(['--output=log.txt', 'x']);
    expect(output).toBe('log.txt');
    expect(args).toEqual(['x']);
  });

  it('supports -o=value', () => {
    const { args, output } = parseOutputFlag(['-o=data.json']);
    expect(output).toBe('data.json');
    expect(args).toEqual([]);
  });

  it('returns args unchanged when no flag', () => {
    const arr = ['foo'];
    const result = parseOutputFlag(arr);
    expect(result.output).toBeUndefined();
    expect(result.args).toBe(arr);
  });
});

describe('parseDateRangeFlags', () => {
  it('extracts --start and --end flags', () => {
    const { args, start, end } = parseDateRangeFlags([
      '--start',
      '2024-01-01',
      '--end',
      '2024-01-07',
      'foo',
    ]);
    expect(start).toBe('2024-01-01');
    expect(end).toBe('2024-01-07');
    expect(args).toEqual(['foo']);
  });

  it('supports --start=value syntax', () => {
    const { args, start, end } = parseDateRangeFlags([
      '--start=2025-01-01',
      '--end=2025-01-02',
    ]);
    expect(start).toBe('2025-01-01');
    expect(end).toBe('2025-01-02');
    expect(args).toEqual([]);
  });

  it('returns args unchanged when absent', () => {
    const arr = ['foo'];
    const result = parseDateRangeFlags(arr);
    expect(result.start).toBeUndefined();
    expect(result.end).toBeUndefined();
    expect(result.args).toBe(arr);
  });
});

describe('parseDryRunFlag', () => {
  it('detects --dry-run flag', () => {
    const { args, dryRun } = parseDryRunFlag(['--dry-run', 'foo']);
    expect(dryRun).toBe(true);
    expect(args).toEqual(['foo']);
  });

  it('supports -d alias', () => {
    const { args, dryRun } = parseDryRunFlag(['-d']);
    expect(dryRun).toBe(true);
    expect(args).toEqual([]);
  });

  it('returns args unchanged when no flag', () => {
    const arr = ['foo'];
    const result = parseDryRunFlag(arr);
    expect(result.dryRun).toBe(false);
    expect(result.args).toBe(arr);
  });
});

describe('parseLimitFlag', () => {
  it('extracts --limit flag', () => {
    const { args, limit } = parseLimitFlag(['--limit', '50', 'rest']);
    expect(limit).toBe(50);
    expect(args).toEqual(['rest']);
  });

  it('supports -l alias', () => {
    const { args, limit } = parseLimitFlag(['-l', '5']);
    expect(limit).toBe(5);
    expect(args).toEqual([]);
  });

  it('supports --limit=value', () => {
    const { args, limit } = parseLimitFlag(['--limit=20']);
    expect(limit).toBe(20);
    expect(args).toEqual([]);
  });

  it('supports -l=value', () => {
    const { args, limit } = parseLimitFlag(['-l=15', 'x']);
    expect(limit).toBe(15);
    expect(args).toEqual(['x']);
  });

  it('returns args unchanged when absent', () => {
    const arr = ['foo'];
    const res = parseLimitFlag(arr);
    expect(res.limit).toBeUndefined();
    expect(res.args).toBe(arr);
  });

  it('ignores invalid numbers', () => {
    const res = parseLimitFlag(['--limit', '0']);
    expect(res.limit).toBeUndefined();
    expect(res.args).toEqual([]);
  });

  it('ignores non numeric values', () => {
    const res = parseLimitFlag(['-l', 'x']);
    expect(res.limit).toBeUndefined();
    expect(res.args).toEqual([]);
  });
});

describe('parseTablesFlag', () => {
  it('extracts --tables flag', () => {
    const { args, tables } = parseTablesFlag([
      '--tables',
      'a,b,c',
      'rest',
    ]);
    expect(tables).toEqual(['a', 'b', 'c']);
    expect(args).toEqual(['rest']);
  });

  it('supports -t alias', () => {
    const { args, tables } = parseTablesFlag(['-t', 'x']);
    expect(tables).toEqual(['x']);
    expect(args).toEqual([]);
  });

  it('supports --tables=value', () => {
    const { args, tables } = parseTablesFlag(['--tables=a,b']);
    expect(tables).toEqual(['a', 'b']);
    expect(args).toEqual([]);
  });

  it('supports -t=value', () => {
    const { args, tables } = parseTablesFlag(['-t=a', 'rest']);
    expect(tables).toEqual(['a']);
    expect(args).toEqual(['rest']);
  });

  it('deduplicates table names', () => {
    const { tables } = parseTablesFlag(['--tables', 'a,b,a,c,b']);
    expect(tables).toEqual(['a', 'b', 'c']);
  });

  it('returns args unchanged when absent', () => {
    const arr = ['foo'];
    const res = parseTablesFlag(arr);
    expect(res.tables).toBeUndefined();
    expect(res.args).toBe(arr);
  });
});

describe('parseGzipFlag', () => {
  it('detects --gzip flag', () => {
    const { args, gzip } = parseGzipFlag(['--gzip', 'rest']);
    expect(gzip).toBe(true);
    expect(args).toEqual(['rest']);
  });

  it('supports -z alias', () => {
    const { args, gzip } = parseGzipFlag(['-z']);
    expect(gzip).toBe(true);
    expect(args).toEqual([]);
  });

  it('supports --gzip=value', () => {
    const { args, gzip } = parseGzipFlag(['--gzip=1']);
    expect(gzip).toBe(true);
    expect(args).toEqual([]);
  });

  it('supports -z=value', () => {
    const { args, gzip } = parseGzipFlag(['-z=yes', 'foo']);
    expect(gzip).toBe(true);
    expect(args).toEqual(['foo']);
  });

  it('returns args unchanged when absent', () => {
    const arr = ['foo'];
    const res = parseGzipFlag(arr);
    expect(res.gzip).toBe(false);
    expect(res.args).toBe(arr);
  });
});

describe('parsePrettyFlag', () => {
  it('detects --pretty flag', () => {
    const { args, pretty } = parsePrettyFlag(['--pretty', 'x']);
    expect(pretty).toBe(true);
    expect(args).toEqual(['x']);
  });

  it('supports -p alias', () => {
    const { args, pretty } = parsePrettyFlag(['-p']);
    expect(pretty).toBe(true);
    expect(args).toEqual([]);
  });

  it('supports --pretty=value', () => {
    const { args, pretty } = parsePrettyFlag(['--pretty=yes', 'a']);
    expect(pretty).toBe(true);
    expect(args).toEqual(['a']);
  });

  it('supports -p=value', () => {
    const { args, pretty } = parsePrettyFlag(['-p=1']);
    expect(pretty).toBe(true);
    expect(args).toEqual([]);
  });

  it('returns args unchanged when absent', () => {
    const arr = ['foo'];
    const res = parsePrettyFlag(arr);
    expect(res.pretty).toBe(false);
    expect(res.args).toBe(arr);
  });
});

describe('parseConcurrencyFlag', () => {
  it('extracts --concurrency flag', () => {
    const { args, concurrency } = parseConcurrencyFlag(['--concurrency', '2', 'rest']);
    expect(concurrency).toBe(2);
    expect(args).toEqual(['rest']);
  });

  it('supports -c alias', () => {
    const { args, concurrency } = parseConcurrencyFlag(['-c', '3']);
    expect(concurrency).toBe(3);
    expect(args).toEqual([]);
  });

  it('supports --concurrency=value', () => {
    const { args, concurrency } = parseConcurrencyFlag(['--concurrency=4']);
    expect(concurrency).toBe(4);
    expect(args).toEqual([]);
  });

  it('supports -c=value', () => {
    const { args, concurrency } = parseConcurrencyFlag(['-c=6', 'x']);
    expect(concurrency).toBe(6);
    expect(args).toEqual(['x']);
  });

  it('returns args unchanged when absent', () => {
    const arr = ['foo'];
    const res = parseConcurrencyFlag(arr);
    expect(res.concurrency).toBeUndefined();
    expect(res.args).toBe(arr);
  });

  it('ignores invalid numbers', () => {
    const res = parseConcurrencyFlag(['--concurrency', '0']);
    expect(res.concurrency).toBeUndefined();
    expect(res.args).toEqual([]);
  });

  it('ignores non numeric values', () => {
    const res = parseConcurrencyFlag(['-c', 'x']);
    expect(res.concurrency).toBeUndefined();
    expect(res.args).toEqual([]);
  });
});

describe('parseSupabaseFlags', () => {
  it('extracts --url and --key', () => {
    const { args, url, key } = parseSupabaseFlags([
      '--url',
      'https://x.supabase.co',
      '--key',
      'k1',
      'rest',
    ]);
    expect(url).toBe('https://x.supabase.co');
    expect(key).toBe('k1');
    expect(args).toEqual(['rest']);
  });

  it('supports -u and -k aliases', () => {
    const { args, url, key } = parseSupabaseFlags(['-u', 'url', '-k', 'key']);
    expect(url).toBe('url');
    expect(key).toBe('key');
    expect(args).toEqual([]);
  });

  it('supports --url=value and --key=value', () => {
    const { args, url, key } = parseSupabaseFlags([
      '--url=https://a.supabase.co',
      '--key=abc',
    ]);
    expect(url).toBe('https://a.supabase.co');
    expect(key).toBe('abc');
    expect(args).toEqual([]);
  });

  it('supports -u=value and -k=value', () => {
    const { args, url, key } = parseSupabaseFlags(['-u=foo', '-k=bar', 'x']);
    expect(url).toBe('foo');
    expect(key).toBe('bar');
    expect(args).toEqual(['x']);
  });

  it('returns args unchanged when absent', () => {
    const arr = ['foo'];
    const res = parseSupabaseFlags(arr);
    expect(res.url).toBeUndefined();
    expect(res.key).toBeUndefined();
    expect(res.args).toBe(arr);
  });
});

describe('parseMamaIdFlag', () => {
  it('extracts --mama-id flag', () => {
    const { args, mamaId } = parseMamaIdFlag(['--mama-id', 'm1', 'rest']);
    expect(mamaId).toBe('m1');
    expect(args).toEqual(['rest']);
  });

  it('supports -m alias', () => {
    const { args, mamaId } = parseMamaIdFlag(['-m', 'm2']);
    expect(mamaId).toBe('m2');
    expect(args).toEqual([]);
  });

  it('supports --mama-id=value', () => {
    const { args, mamaId } = parseMamaIdFlag(['--mama-id=m3']);
    expect(mamaId).toBe('m3');
    expect(args).toEqual([]);
  });

  it('supports -m=value', () => {
    const { args, mamaId } = parseMamaIdFlag(['-m=m4', 'x']);
    expect(mamaId).toBe('m4');
    expect(args).toEqual(['x']);
  });

  it('returns args unchanged when absent', () => {
    const arr = ['foo'];
    const result = parseMamaIdFlag(arr);
    expect(result.mamaId).toBeUndefined();
    expect(result.args).toBe(arr);
  });
});

describe('parseFormatFlag', () => {
  it('extracts --format flag', () => {
    const { args, format } = parseFormatFlag(['--format', 'csv', 'rest']);
    expect(format).toBe('csv');
    expect(args).toEqual(['rest']);
  });

  it('supports -f alias', () => {
    const { args, format } = parseFormatFlag(['-f', 'xlsx']);
    expect(format).toBe('xlsx');
    expect(args).toEqual([]);
  });

  it('supports --format=value', () => {
    const { args, format } = parseFormatFlag(['--format=json']);
    expect(format).toBe('json');
    expect(args).toEqual([]);
  });

  it('supports -f=value', () => {
    const { args, format } = parseFormatFlag(['-f=csv', 'x']);
    expect(format).toBe('csv');
    expect(args).toEqual(['x']);
  });

  it('ignores invalid formats', () => {
    const { args, format } = parseFormatFlag(['--format', 'txt', 'x']);
    expect(format).toBeUndefined();
    expect(args).toEqual(['x']);
  });

  it('returns args unchanged when absent', () => {
    const arr = ['foo'];
    const result = parseFormatFlag(arr);
    expect(result.format).toBeUndefined();
    expect(result.args).toBe(arr);
  });
});

describe('toCsv', () => {
  it('converts rows to csv', () => {
    const csv = toCsv([
      { a: 1, b: 'x' },
      { a: 2, b: 'y' },
    ]);
    expect(csv).toBe('a,b\n"1","x"\n"2","y"');
  });

  it('returns empty string for empty array', () => {
    expect(toCsv([])).toBe('');
  });
});

describe('isMainModule', () => {
  it('checks whether import was executed directly', () => {
    const metaUrl = new URL('./foo.js', `file://${process.cwd()}/`).href;
    expect(isMainModule(metaUrl, 'foo.js')).toBe(true);
    expect(isMainModule(metaUrl, `${process.cwd()}/foo.js`)).toBe(true);
    expect(isMainModule(metaUrl, 'bar.js')).toBe(false);
  });
});

