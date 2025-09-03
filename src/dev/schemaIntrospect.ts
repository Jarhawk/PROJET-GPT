export interface TableInfo {
  colonnes: Set<string>;
  aliasRecommandes: Record<string, string>;
  rlsParMama: boolean;
}

export type SchemaMap = Record<string, TableInfo>;

let cached: SchemaMap | null = null;

export async function loadBackendSchema(): Promise<SchemaMap> {
  if (cached) return cached;
  const res = await fetch('/db/Etat back end.txt');
  const txt = await res.text();
  const lines = txt.split('\n');
  const map: SchemaMap = {};
  for (const line of lines) {
    const m = line.match(/^\|\s*([\w_]+)\s*\|\s*\d+\s*\|\s*([\w_]+)\s*\|/);
    if (!m) continue;
    const table = m[1];
    const col = m[2];
    const info = map[table] || { colonnes: new Set<string>(), aliasRecommandes: {}, rlsParMama: false };
    info.colonnes.add(col);
    if (col === 'mama_id') info.rlsParMama = true;
    map[table] = info;
  }
  cached = map;
  return map;
}

function ensureLoaded() {
  if (!cached) throw new Error('Schema not loaded. Call loadBackendSchema() first.');
}

export function hasColumn(table: string, col: string): boolean {
  ensureLoaded();
  return Boolean(cached![table]?.colonnes.has(col));
}

export function assertSelect(columns: string[], table: string): string[] {
  ensureLoaded();
  const info = cached![table];
  if (!info) return columns;
  return columns.map((c) => {
    if (info.colonnes.has(c)) return c;
    const real = info.aliasRecommandes[c];
    if (real) {
      console.warn(`Column ${c} not found in ${table}. Using alias ${c}:${real}`);
      return `${c}:${real}`;
    }
    console.warn(`Column ${c} not found in ${table}`);
    return c;
  });
}
