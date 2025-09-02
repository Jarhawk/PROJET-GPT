import { promises as fs } from 'node:fs';
import path from 'node:path';

const PAGES_DIR = path.resolve('src/pages');
const OUT_FILE = path.resolve('src/config/routes.generated.json');

function humanize(name) {
  return name
    .replace(/\..+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, m => m.toUpperCase());
}

async function walk(dir, base='') {
  const items = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const it of items) {
    if (it.name.startsWith('_') || it.name.startsWith('.')) continue;
    const rel = path.join(base, it.name);
    const abs = path.join(dir, it.name);
    if (it.isDirectory()) {
      files.push(...await walk(abs, rel));
    } else if (/\.(jsx?|tsx?)$/.test(it.name)) {
      files.push(rel.replaceAll('\\','/'));
    }
  }
  return files;
}

function fileToRoute(file) {
  // ex: 'produits/Produits.jsx' -> '/produits'
  const parts = file.split('/');
  const leaf = parts[parts.length - 1].replace(/\.(jsx?|tsx?)$/,'');
  const group = parts.length > 1 ? humanize(parts[0]) : 'Général';
  // règle : nom de dossier comme segment de path, fichier 'Index' => path dossier
  let pathSegs = parts.map(p => p.replace(/\.(jsx?|tsx?)$/,'').toLowerCase());
  if (/^index$/i.test(leaf)) {
    pathSegs = pathSegs.slice(0, -1);
  }
  const routePath = '/' + pathSegs.filter(Boolean).join('/');
  // labelKey par défaut 'nav.<dossier|fichier>'
  const labelKey = 'nav.' + (group === 'Général' ? leaf.toLowerCase() : parts[0].toLowerCase());
  return {
    path: routePath,
    file,
    labelKey,
    group,
    showInSidebar: true,
  };
}

async function main() {
  const files = await walk(PAGES_DIR);
  const routes = files.map(fileToRoute);

  // Dé-dupe par (path)
  const seen = new Set();
  const deduped = [];
  for (const r of routes) {
    if (seen.has(r.path)) continue;
    seen.add(r.path);
    deduped.push(r);
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(deduped, null, 2), 'utf8');
  console.log(`Generated ${OUT_FILE} with ${deduped.length} routes`);
}

main().catch(err => { console.error(err); process.exit(1); });
