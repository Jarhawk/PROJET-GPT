import { describe, it, expect } from 'vitest';
import { routes, sidebarRoutes } from '../src/config/routes.js';

describe('Navigation coverage', () => {
  it('paths are unique', () => {
    const paths = routes.map((r) => r.path);
    const dup = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(dup, `Duplicate paths: ${dup.join(', ')}`).toEqual([]);
  });

  it('sidebar routes have labels', () => {
    const missingLabel = sidebarRoutes.filter((r) => !r.label);
    expect(
      missingLabel,
      `Routes missing labels: ${missingLabel.map((r) => r.path).join(', ')}`,
    ).toEqual([]);
  });
});

