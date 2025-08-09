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
  }
  const arr = Object.values(refs).sort((a, b) => a.name.localeCompare(b.name));
  await fs.writeFile('FRONT_REFERENCES.json', JSON.stringify(arr, null, 2));
  return arr;
}

async function parseSchema() {
  const sql = await fs.readFile(path.join('db', 'full_setup_final.sql'), 'utf8');
  const objs = [];
  const tableRegex = /create table if not exists public\.([a-zA-Z0-9_]+)/gi;
  const viewRegex = /create or replace view public\.([a-zA-Z0-9_]+)/gi;
  const funcRegex = /create or replace function public\.([a-zA-Z0-9_]+)/gi;
  let m;
  while ((m = tableRegex.exec(sql))) objs.push({ type: 'table', name: m[1] });
  while ((m = viewRegex.exec(sql))) objs.push({ type: 'view', name: m[1] });
  while ((m = funcRegex.exec(sql))) objs.push({ type: 'function', name: m[1] });
  await fs.writeFile('SCHEMA_OBJECTS.json', JSON.stringify(objs, null, 2));
  return objs;
}

function diff(frontRefs, schemaObjs) {
  const schemaMap = new Map(schemaObjs.map(o => [o.name, o.type]));
  const ok = [];
  const missing = [];
  const legacy = [];
  for (const ref of frontRefs) {
    const exists = schemaMap.has(ref.name);
    if (exists) {
      ok.push(ref.name);
    } else if (ref.name.includes('mouvement')) {
      legacy.push(ref);
    } else {
      missing.push(ref);
    }
  }
  return { ok, missing, legacy };
}

async function writeReport(result) {
  let md = '# Vérification schéma vs Front\n\n';
  md += '## ✅ OK (présents)\n';
  result.ok.sort().forEach(name => {
    md += `- ${name}\n`;
  });
  md += '\n## ❌ Manquants (à créer côté SQL)\n';
  result.missing.forEach(r => {
    const files = r.files.map(f => `${f.file}:${f.line}`).join(', ');
    md += `- ${r.name} (${files})\n`;
  });
  md += '\n## ⚠️ Appels legacy\n';
  result.legacy.forEach(r => {
    const files = r.files.map(f => `${f.file}:${f.line}`).join(', ');
    md += `- ${r.name} (${files})\n`;
  });
  await fs.writeFile(path.join('db', 'VERIFY_GAPS.md'), md);
}

(async () => {
  const front = await scanFront();
  const schema = await parseSchema();
  const res = diff(front, schema);
  await writeReport(res);
  if (res.missing.length > 0) {
    console.error('Missing schema objects detected');
    process.exit(1);
  }
})();
