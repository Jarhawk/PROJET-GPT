import { spawnSync } from 'child_process';
import { describe, it, expect } from 'vitest';

function check(script, ...args) {
  const { status, stdout } = spawnSync('node', [script, ...args], {
    encoding: 'utf8',
  });
  expect(status).toBe(0);
  expect(stdout.trim()).toMatch(/^Usage:/);
}

const scripts = [
  'scripts/backup_db.js',
  'scripts/export_accounting.js',
  'scripts/reallocate_history.js',
  'scripts/weekly_report.js',
];

describe.each(scripts)('%s help flag', (script) => {
  it('shows usage regardless of flag position', () => {
    check(script, '--help');
    check(script, 'foo', '--help');
    check(script, '-h');
  });
});
