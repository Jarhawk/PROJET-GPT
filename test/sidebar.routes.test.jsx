import { describe, it, expect } from 'vitest';
import { APP_ROUTES, HIDDEN_ROUTES } from '../src/config/routes.js';

const routes = APP_ROUTES.concat(HIDDEN_ROUTES);

describe('Navigation coverage', () => {
  it('paths are unique', () => {
    const paths = routes.map(r => r.path);
    const dup = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(dup, `Duplicate paths: ${dup.join(', ')}`).toEqual([]);
  });

  it('sidebar routes have labels', () => {
    const missingLabel = routes.filter(r => r.showInSidebar && !r.labelKey);
    expect(missingLabel, `Routes missing labels: ${missingLabel.map(r => r.path).join(', ')}`).toEqual([]);
  });
});

