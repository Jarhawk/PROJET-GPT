import { spawnSync } from 'child_process';
import { describe, it, expect } from 'vitest';
import { getPackageVersion } from '../scripts/cli_utils.js';

function check(script, ...args) {
  const { status, stdout } = spawnSync('node', [script, ...args], {
    encoding: 'utf8',
  });
  expect(status).toBe(0);
  expect(stdout.trim()).toBe(getPackageVersion());
}

const scripts = [
  'scripts/backup_db.js',
  'scripts/export_accounting.js',
  'scripts/reallocate_history.js',
  'scripts/weekly_report.js',
];

describe.each(scripts)('%s version flag', (script) => {
  it('prints version with --version and -v', () => {
    check(script, '--version');
    check(script, '-v');
  });
});
