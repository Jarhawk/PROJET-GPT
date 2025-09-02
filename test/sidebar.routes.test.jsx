import { describe, it, expect } from 'vitest';
import routes from '../src/config/routes.merged.js';
import fs from 'node:fs';
import path from 'node:path';

function listPages() {
  const base = path.resolve('src/pages');
  const out = [];
  const walk = (dir, baseRel='') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      const rel = path.join(baseRel, entry.name);
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs, rel);
      else if (/\.(jsx?|tsx?)$/.test(entry.name)) out.push(rel.replaceAll('\\','/'));
    }
  };
  walk(base);
  return out;
}

describe('Navigation coverage', () => {
  it('every page file has a route', () => {
    const files = listPages();
    const byFile = new Set(routes.map(r => r.file));
    const missing = files.filter(f => !byFile.has(f));
    expect(missing, `Missing routes for files:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every route is visible in sidebar or explicitly hidden', () => {
    const invisible = routes.filter(r => r.showInSidebar === false);
    const visible = routes.filter(r => r.showInSidebar !== false);
    expect(invisible.length + visible.length).toBe(routes.length);
  });

  it('paths are unique', () => {
    const paths = routes.map(r => r.path);
    const dup = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(dup, `Duplicate paths: ${dup.join(', ')}`).toEqual([]);
  });
});
