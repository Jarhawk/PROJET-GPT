/* eslint-disable */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

const PAGES_DIR = path.join(SRC, 'pages');
const ROUTES_FILES = [
  path.join(SRC, 'config', 'routes.js'),
  path.join(SRC, 'router.jsx'),
];
const LOCALES = [
  path.join(SRC, 'i18n', 'locales', 'fr.json'),
  path.join(SRC, 'i18n', 'locales', 'en.json'),
];

// ---------- utils fs
function ls(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map(n => path.join(dir, n));
}
function read(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}
function isPageFile(f) {
  return /\.(jsx?|tsx?)$/.test(f) && f.includes(`${path.sep}pages${path.sep}`);
}
function walk(dir, acc = []) {
  for (const p of ls(dir)) {
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
function uniq(a) { return Array.from(new Set(a)); }

// ---------- parse i18n
function loadI18n() {
  const out = {};
  for (const f of LOCALES) {
    const raw = read(f);
    if (!raw) continue;
    try { out[path.basename(f, '.json')] = JSON.parse(raw); } catch {}
  }
  return out;
}

// ---------- parse routes config
function parseRoutesFromSource(src, srcFile) {
  // Tolérant: on récupère path + import('../pages/...') + labelKey + icon + showInSidebar + access
  const records = [];
  // capture blocs { path: '...', element: lazy(() => import('../pages/..')), labelKey:'..', icon:'..', showInSidebar:true, access:'..' }
  const blockRegex = /\{[^{}]*path\s*:\s*['"`]([^'"`]+)['"`][\s\S]*?element\s*:\s*(?:lazy\s*\(\s*\(\s*=>\s*)?import\s*\(\s*['"`]\.\.\/pages\/([^'"`]+)['"`]\s*\)\)?[\s\S]*?\}/g;
  let m;
  while ((m = blockRegex.exec(src))) {
    const [block, pathVal, importRel] = m;
    const grab = (key) => {
      const r = new RegExp(`${key}\s*:\s*['"\`]([^'"\`]+)['"\`]`);
      const sm = block.match(r);
      return sm ? sm[1] : undefined;
    };
    const bool = (key) => {
      const r = new RegExp(`${key}\\s*:\\s*(true|false)`);
      const sm = block.match(r);
      return sm ? sm[1] === 'true' : undefined;
    };
    records.push({
      routePath: pathVal,
      importRel: importRel.replace(/^\.\//, ''),
      labelKey: grab('labelKey'),
      icon: grab('icon'),
      showInSidebar: bool('showInSidebar'),
      access: grab('access'),
      __src: srcFile,
    });
  }
  return records;
}

function collectRoutes() {
  const routes = [];
  for (const f of ROUTES_FILES) {
    const src = read(f);
    if (!src) continue;
    routes.push(...parseRoutesFromSource(src, path.relative(ROOT, f)));
  }
  // map par importRel normalisé
  const map = new Map();
  for (const r of routes) {
    const key = r.importRel.replace(/\.(jsx?|tsx?)$/, '');
    const arr = map.get(key) || [];
    arr.push(r);
    map.set(key, arr);
  }
  return { routes, routesByImport: map };
}

// ---------- parse page source for info
function parsePage(file) {
  const src = read(file);
  const rel = path.relative(SRC, file).replace(/\\/g, '/'); // e.g. pages/produits/Produits.jsx
  const compName = (() => {
    const m = src.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/)
          || src.match(/function\s+([A-Za-z0-9_]+)\s*\(/)
          || src.match(/export\s+default\s+([A-Za-z0-9_]+)/);
    return m ? m[1] : null;
  })();

  // deviner titre / usage
  const title =
    (src.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]) ||
    (src.match(/const\s+title\s*=\s*['"`]([^'"`]+)['"`]/)?.[1]) ||
    (src.match(/PageTitle[^'\"]*['"`]([^'"`]+)['"`]/)?.[1]) ||
    null;

  const description = (() => {
    const comment = src.match(/\/\*\*([\s\S]*?)\*\//)?.[1]
                 || src.match(/\/\/\s*(.+)/)?.[1];
    return comment ? comment.trim().split('\n').map(s=>s.trim()).slice(0,2).join(' ') : null;
  })();

  // hooks importés
  const hooks = Array.from(src.matchAll(/from\s+['"`]\.\.{1,2}\/hooks\/([^'"`]+)['"`]/g)).map(m => m[1]);

  // tables/rpc supabase (sur la page)
  const tables = Array.from(src.matchAll(/\.from\s*\(\s*['"`]([a-z0-9_]+)['"`]\s*\)/gi)).map(m=>m[1]);
  const rpcs   = Array.from(src.matchAll(/\.rpc\s*\(\s*['"`]([a-z0-9_]+)['"`]\s*\)/gi)).map(m=>m[1]);

  return {
    pageFile: rel,
    component: compName,
    inferredTitle: title,
    inferredDescription: description,
    hooks: uniq(hooks),
    supabase: { tables: uniq(tables), rpcs: uniq(rpcs) },
  };
}

// ---------- parse hooks to find extra supabase usage
function parseHook(file) {
  const src = read(file);
  const rel = path.relative(SRC, file).replace(/\\/g, '/');
  const tables = Array.from(src.matchAll(/\.from\s*\(\s*['"`]([a-z0-9_]+)['"`]\s*\)/gi)).map(m=>m[1]);
  const rpcs   = Array.from(src.matchAll(/\.rpc\s*\(\s*['"`]([a-z0-9_]+)['"`]\s*\)/gi)).map(m=>m[1]);
  return { hookFile: rel, tables: uniq(tables), rpcs: uniq(rpcs) };
}

// ---------- main
(async function main() {
  const i18n = loadI18n();
  const allFiles = walk(PAGES_DIR).filter(isPageFile);
  const { routes, routesByImport } = collectRoutes();

  // index des hooks pour scan supabase complémentaire
  const allHookFiles = walk(path.join(SRC, 'hooks')).filter(f => /\.(jsx?|tsx?)$/.test(f));
  const hookIndex = new Map();
  for (const hf of allHookFiles) {
    hookIndex.set(path.relative(SRC, hf).replace(/\\/g,'/'), parseHook(hf));
  }

  const pages = [];
  for (const file of allFiles) {
    const info = parsePage(file);

    // retrouver la/les routes associées via importRel
    // ex: routesByImport key: 'pages/produits/Produits'
    const key = info.pageFile.replace(/\.(jsx?|tsx?)$/, '');
    const rs = routesByImport.get(key) || [];

    // compléter supabase depuis hooks importés
    const extraTables = [];
    const extraRpcs = [];
    for (const h of info.hooks) {
      // normaliser '../hooks/data/useX.js' -> 'hooks/data/useX.js'
      const guess = h.replace(/^\.{1,2}\//, '').replace(/\\/g,'/');
      const hf = 'src/' + guess;
      const rel = guess.startsWith('hooks') ? guess : null;
      const found = hookIndex.get(rel || '');
      if (found) {
        extraTables.push(...found.tables);
        extraRpcs.push(...found.rpcs);
      }
    }

    const label = rs.map(r => {
      const key = r.labelKey;
      const fr = key ? (i18n.fr?.[key] ?? null) : null;
      return { key, fr };
    });

    pages.push({
      ...info,
      routes: rs.map(r => ({
        path: r.routePath,
        labelKey: r.labelKey,
        labelFR: r.labelKey ? (i18n.fr?.[r.labelKey] ?? null) : null,
        icon: r.icon,
        showInSidebar: r.showInSidebar,
        access: r.access,
        definedIn: r.__src,
      })),
      supabase: {
        tables: uniq([...(info.supabase.tables||[]), ...extraTables]),
        rpcs: uniq([...(info.supabase.rpcs||[]), ...extraRpcs]),
      }
    });
  }

  // pages orphelines / routes orphelines
  const pageKeys = new Set(pages.map(p => p.pageFile.replace(/\.(jsx?|tsx?)$/,'')));
  const orphanRoutes = routes.filter(r => !pageKeys.has(`pages/${r.importRel.replace(/\.(jsx?|tsx?)$/, '')}`));

  const routesByPath = new Map();
  for (const r of routes) {
    const arr = routesByPath.get(r.routePath) || [];
    arr.push(r);
    routesByPath.set(r.routePath, arr);
  }

  const missingInSidebar = pages
    .flatMap(p => p.routes.length ? p.routes : [{ path:null, labelKey:null, icon:null, showInSidebar:false, access:null }])
    .filter(r => r.path && r.showInSidebar === false);

  // -------- outputs
  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      pages: pages.length,
      routes: routes.length,
      orphanRoutes: orphanRoutes.length,
    },
    pages,
    orphanRoutes,
  };

  const outJson = path.join(ROOT, 'pages_report.json');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');

  // Markdown
  const md = [];
  md.push(`# Inventaire des pages (généré)`);
  md.push(`- Généré: ${report.generatedAt}`);
  md.push(`- Pages: ${report.totals.pages} — Routes: ${report.totals.routes} — Routes orphelines: ${report.totals.orphanRoutes}`);
  md.push('');
  for (const p of pages) {
    md.push(`## ${p.pageFile}`);
    md.push(`- Composant: \`${p.component || 'N/A'}\``);
    if (p.inferredTitle) md.push(`- Titre deviné: **${p.inferredTitle}**`);
    if (p.inferredDescription) md.push(`- Description: ${p.inferredDescription}`);
    if (p.routes.length) {
      md.push(`- Routes:`);
      for (const r of p.routes) {
        md.push(`  - \`${r.path}\` • labelKey: \`${r.labelKey || '-'}\` (${r.labelFR || '-'}) • icon: \`${r.icon || '-'}\` • sidebar: ${r.showInSidebar === true ? 'oui' : r.showInSidebar === false ? 'non' : 'indéfini'} • access: \`${r.access || '-'}\` • défini dans: \`${r.definedIn}\``);
      }
    } else {
      md.push(`- ⚠️ Aucune route trouvée pour ce fichier page.`);
    }
    if (p.hooks?.length) md.push(`- Hooks importés: \`${p.hooks.join('`, `')}\``);
    const t = p.supabase?.tables || [];
    const r = p.supabase?.rpcs || [];
    md.push(`- Supabase: tables = ${t.length ? '\`' + t.join('`, `') + '\`' : '-'}, rpc = ${r.length ? '\`' + r.join('`, `') + '\`' : '-'}`);
    md.push('');
  }
  if (orphanRoutes.length) {
    md.push(`### Routes orphelines (référencent un import de page introuvable)`);
    for (const r of orphanRoutes) {
      md.push(`- \`${r.routePath}\` → import('../pages/${r.importRel}') (défini dans \`${r.__src}\`)`);
    }
  }
  if (missingInSidebar.length) {
    md.push(`\n### Pages non affichées dans la sidebar`);
    uniq(missingInSidebar.map(r => r.path)).forEach(p => md.push(`- ${p}`));
  }

  const outMd = path.join(ROOT, 'pages_report.md');
  fs.writeFileSync(outMd, md.join('\n'), 'utf8');

  console.log(`\n✅ Rapport généré:\n- ${outJson}\n- ${outMd}\n`);
})();
