import { promises as fs } from 'fs';
import path from 'path';

async function walk(dir, extensions, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, extensions, files);
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

function addRef(map, type, name, file, line) {
  if (!map[name]) map[name] = { type, name, files: [] };
  map[name].files.push({ file: path.relative(process.cwd(), file), line });
}

async function scanFront() {
  const files = await walk(path.join(process.cwd(), 'src'), ['.js', '.jsx', '.ts', '.tsx']);
  const refs = {};
  const fromRegex = /supabase\s*\.from\(\s*['"]([^'"\)]+)['"]\s*\)/g;
  const rpcRegex = /supabase\s*\.rpc\(\s*['"]([^'"\)]+)['"]\s*\)/g;
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    let m;
    while ((m = fromRegex.exec(content))) {
      const before = content.slice(0, m.index);
      const line = before.split(/\r?\n/).length;
      const name = m[1];
      const type = name.startsWith('v_') ? 'view' : 'table';
      addRef(refs, type, name, file, line);
    }
    while ((m = rpcRegex.exec(content))) {
      const before = content.slice(0, m.index);
      const line = before.split(/\r?\n/).length;
      const name = m[1];
      addRef(refs, 'function', name, file, line);
    }
    while ((m = importRegex.exec(content))) {
      const before = content.slice(0, m.index);
      const line = before.split(/\r?\n/).length;
      const p = m[1];
      const base = path.basename(p);
      if (base.startsWith('v_')) {
        addRef(refs, 'view', base, file, line);
      }
    }
  }
  return Object.values(refs);
}

async function parseSchema() {
  const sql = await fs.readFile(path.join('db', 'full_setup_fixed.sql'), 'utf8');
  const tables = new Set();
  const views = new Set();
  const functions = new Set();
  const tableRegex = /create table if not exists public\.([a-zA-Z0-9_]+)/gi;
  const viewRegex = /create or replace view public\.([a-zA-Z0-9_]+)/gi;
  const funcRegex = /create or replace function public\.([a-zA-Z0-9_]+)/gi;
  let m;
  while ((m = tableRegex.exec(sql))) tables.add(m[1]);
  while ((m = viewRegex.exec(sql))) views.add(m[1]);
  while ((m = funcRegex.exec(sql))) functions.add(m[1]);
  return { tables, views, functions };
}

function diff(refs, schema) {
  const missingTables = [];
  const missingViews = [];
  const missingFunctions = [];
  const legacy = [];
  for (const r of refs) {
    if (r.name.includes('mouvement')) {
      legacy.push(r);
      continue;
    }
    if (r.type === 'table' && !schema.tables.has(r.name)) missingTables.push(r);
    if (r.type === 'view' && !schema.views.has(r.name)) missingViews.push(r);
    if (r.type === 'function' && !schema.functions.has(r.name)) missingFunctions.push(r);
  }
  return { missingTables, missingViews, missingFunctions, legacy };
}

async function writeReport(res) {
  let md = '# Front vs SQL gaps\n\n';
  md += '## Missing tables\n';
  res.missingTables.forEach(r => {
    const files = r.files.map(f => `${f.file}:${f.line}`).join(', ');
    md += `- ${r.name} (${files})\n`;
  });
  md += '\n## Missing views\n';
  res.missingViews.forEach(r => {
    const files = r.files.map(f => `${f.file}:${f.line}`).join(', ');
    md += `- ${r.name} (${files})\n`;
  });
  md += '\n## Missing functions\n';
  res.missingFunctions.forEach(r => {
    const files = r.files.map(f => `${f.file}:${f.line}`).join(', ');
    md += `- ${r.name} (${files})\n`;
  });
  md += '\n## Legacy refs\n';
  res.legacy.forEach(r => {
    const files = r.files.map(f => `${f.file}:${f.line}`).join(', ');
    md += `- ${r.name} (${files})\n`;
  });
  await fs.writeFile(path.join('REPORTS', 'FRONT_SQL_GAPS.md'), md);
}

(async () => {
  const refs = await scanFront();
  const schema = await parseSchema();
  const res = diff(refs, schema);
  await writeReport(res);
})();
