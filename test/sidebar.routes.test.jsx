import { describe, it, expect } from 'vitest';
import { ROUTES } from '../src/config/routes.js';

describe('Navigation coverage', () => {
  it('paths are unique', () => {
    const paths = ROUTES.map((r) => r.path);
    const dup = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(dup, `Duplicate paths: ${dup.join(', ')}`).toEqual([]);
  });

  it('sidebar routes have labelKey', () => {
    const missing = ROUTES.filter((r) => r.showInSidebar !== false && !r.labelKey);
    expect(
      missing,
      `Routes missing labelKey: ${missing.map((r) => r.path).join(', ')}`,
    ).toEqual([]);
  });
});
