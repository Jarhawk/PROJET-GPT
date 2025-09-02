import base from './routes.base.js';
import gen from './routes.generated.json';
import modules from '../config/modules.js'; // feature flags éventuels

/** @type {import('./routeTypes').RouteMeta[]} */
const merged = (() => {
  const byPath = new Map(base.map(r => [r.path, r]));
  for (const r of gen) {
    if (byPath.has(r.path)) {
      // merge : base écrase gen
      byPath.set(r.path, { ...r, ...byPath.get(r.path) });
    } else {
      byPath.set(r.path, r);
    }
  }
  // Appliquer feature flags (si modules[flag] === false => masquer)
  const list = Array.from(byPath.values()).map(r => {
    if (r.featureFlag && modules && Object.prototype.hasOwnProperty.call(modules, r.featureFlag)) {
      return { ...r, showInSidebar: !!modules[r.featureFlag] && r.showInSidebar !== false };
    }
    return r;
  });
  return list.sort((a, b) => a.group?.localeCompare(b.group || '') || a.path.localeCompare(b.path));
})();

export default merged;
