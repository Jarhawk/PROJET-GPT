#!/usr/bin/env node
/* Audit projet Vite/React — routes, chemins, imports, Supabase, TODO/FIXME
   Sorties : /audit/audit-report.json et /audit/AUDIT.md
*/
import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { init, parse } from 'es-module-lexer';
import * as esbuild from 'esbuild';
import pc from 'picocolors';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'audit');
await fs.mkdir(OUT_DIR, { recursive: true });

const norm = p => p.split(path.sep).join('/');
const read = p => fs.readFile(p, 'utf8').catch(() => null);
const uniq = a => [...new Set(a)];

const allFiles = await fg(['src/**/*.{js,jsx,ts,tsx}','!**/__tests__/**','!**/*.d.ts'], { cwd: ROOT, absolute: true });
const allRel = allFiles.map(norm);

// --- esbuild: graphe + erreurs d’import ---
const entryCandidates = await fg(['src/main.*','src/index.*','src/App.*','src/router.*'], { cwd: ROOT, absolute: true });
const entryPoints = entryCandidates.length ? entryCandidates : [path.join(SRC,'main.jsx')];
let meta=null, buildErrors=[];
try {
  const r = await esbuild.build({
    entryPoints,
    bundle: true,
    platform: 'browser',
    format: 'esm',
    metafile: true,
    write: false,
    logLevel: 'silent',
    jsx: 'automatic',
    alias: { '@': SRC },
  });
  meta = r.metafile;
} catch (e) {
  buildErrors = (e?.errors || [{ text: e?.message || String(e) }]).map(x=>x.text);
}
const usedFiles = meta ? Object.keys(meta.inputs).map(i=>norm(path.resolve(ROOT, i))) : [];
const orphanFiles = meta ? allRel.filter(f => !usedFiles.includes(f) && !/\.test\./.test(f)) : [];

// --- Routes & menu ---
async function extractRoutes() {
  const files = await fg(['src/**/router.{js,jsx,ts,tsx}','src/router*.{js,jsx,ts,tsx}'], { cwd: ROOT, absolute: true });
  const out=[];
  for (const f of files) {
    const code = await read(f); if (!code) continue;
    const rx = /<Route\s+([^>]*?)\/>/g;
    const routes=[];
    let m; while ((m=rx.exec(code))) {
      const chunk = m[1] ?? '';
      const pathMatch = chunk.match(/path\s*=\s*["'`](.*?)["'`]/);
      const elemMatch = chunk.match(/element\s*=\s*{?<([A-Za-z0-9_$.]+)/);
      routes.push({ path: pathMatch?.[1] ?? null, element: elemMatch?.[1] ?? null, file: norm(f) });
    }
    out.push({ file: norm(f), routes });
  }
  return out;
}
async function extractMenuLinks() {
  const files = await fg(['src/**/Layout.{js,jsx,ts,tsx}','src/layout/**/*.{js,jsx,ts,tsx}'], { cwd: ROOT, absolute: true });
  const links=[];
  for (const f of files) {
    const code = await read(f); if (!code) continue;
    const navRx = /<(?:NavLink|Link)[^>]*\sto\s*=\s*["'`](.*?)["'`]/g;
    let m; while ((m=navRx.exec(code))) links.push({ file: norm(f), to: m[1] });
  }
  return links;
}
const routeMap = await extractRoutes();
const menuLinks = await extractMenuLinks();
const allRoutePaths = uniq(routeMap.flatMap(rf => rf.routes.map(r => r.path).filter(Boolean)));
const menuPaths = uniq(menuLinks.map(l => l.to));
const menuNotInRoutes = menuPaths.filter(p => !allRoutePaths.some(rp => rp && (rp === p || (rp.includes(':') && p.startsWith(rp.split('/:')[0])))));
const routesNotLinked = allRoutePaths.filter(rp => rp && !menuPaths.some(p => p === rp || p.startsWith(rp.split('/:')[0])));

// --- Supabase scan ---
await init;
const supabaseCalls=[], patterns={
  embedProduit:/produit\s*:\s*produit_id\(/,
  alertesTable:/from\(['"]alertes_rupture['"]\)/,
  traiteOnAlertes:/(traite\s*=\s*eq\.?false)|\.eq\(['"]traite['"]\s*,\s*false\)/,
  vStockTheorique:/v_stock_theorique/,
  restManual:/\/rest\/v1\/[A-Za-z0-9_?=.&%-]+/,
};
for (const f of allRel) {
  const code = await read(f); if (!code) continue;
  const froms=[...code.matchAll(/\.from\(['"]([^'"]+)['"]\)/g)].map(m=>({table:m[1]}));
  const rpcs =[...code.matchAll(/\.rpc\(['"]([^'"]+)['"]\)/g)].map(m=>({fn:m[1]}));
  const rest =[...code.matchAll(patterns.restManual)].map(m=>({url:m[0]}));
  const flags={
    embedProduit:patterns.embedProduit.test(code),
    alertesTable:patterns.alertesTable.test(code),
    traiteOnAlertes:patterns.traiteOnAlertes.test(code),
    vStockTheorique:patterns.vStockTheorique.test(code),
  };
  if (froms.length || rpcs.length || rest.length || Object.values(flags).some(Boolean)) {
    supabaseCalls.push({ file: norm(f), froms, rpcs, rest, flags });
  }
}

// TODO/FIXME/WIP
const taskMarkers=[];
for (const f of allRel) {
  const code = await read(f); if (!code) continue;
  const lines = code.split('\n');
  lines.forEach((ln,i)=>{ if (/(TODO|FIXME|WIP|DEPRECATED)/.test(ln)) taskMarkers.push({ file:norm(f), line:i+1, text:ln.trim() }); });
}

// Exports nommés critiques
async function hasNamedExport(file,name){
  const code=await read(path.join(ROOT,file)); if(!code) return false;
  const [imps, exps]=parse(code); return exps.some(e=>e.n===name);
}
const exportProblems=[];
const checks=[
  { file:'src/hooks/useFournisseursAutocomplete.js', name:'useFournisseursAutocomplete' },
  { file:'src/hooks/useProduitsSearch.js', name:'useProduitsSearch' },
];
for (const ch of checks) {
  const full = norm(path.join(ROOT,ch.file));
  const present = allRel.includes(full);
  if (!present) { exportProblems.push({ file: ch.file, problem:'missing file' }); continue; }
  const ok = await hasNamedExport(ch.file,ch.name);
  if (!ok) exportProblems.push({ file: ch.file, problem:`missing named export '${ch.name}'` });
}

// Synthèse Supabase
const supaSummary = {
  files: supabaseCalls.length,
  embedProduitFiles: supabaseCalls.filter(x=>x.flags.embedProduit).map(x=>x.file),
  alertesTableFiles: supabaseCalls.filter(x=>x.flags.alertesTable).map(x=>x.file),
  traiteOnAlertesFiles: supabaseCalls.filter(x=>x.flags.traiteOnAlertes).map(x=>x.file),
  vStockTheoriqueFiles: supabaseCalls.filter(x=>x.flags.vStockTheorique).map(x=>x.file),
  restManualFiles: supabaseCalls.flatMap(x=>x.rest.map(r=>`${x.file} -> ${r.url}`)),
};

// Écritures
await fs.writeFile(path.join(OUT_DIR,'audit-report.json'), JSON.stringify({
  generatedAt:new Date().toISOString(),
  entryPoints: entryPoints.map(norm), buildErrors, usedFiles, orphanFiles,
  routes: routeMap, menuLinks, menuNotInRoutes, routesNotLinked,
  supabase: supaSummary, supabaseDetails: supabaseCalls,
  taskMarkers, exportProblems
}, null, 2), 'utf8');

const md = `# Rapport d'audit front

Généré: ${new Date().toLocaleString()}

## Routes (depuis router)
${routeMap.map(rf => `- **${rf.file}**\n`+rf.routes.map(r=>`  - path: \`${r.path ?? '∅'}\`  element: \`${r.element ?? '∅'}\``).join('\n')).join('\n')}

## Menu vs Router
- Liens menu uniques: ${menuPaths.length}
- Routes uniques: ${allRoutePaths.length}
### ⚠️ Liens menu sans route correspondante
${(menuNotInRoutes.length? menuNotInRoutes.map(x=>`- ${x}`).join('\n'):'- Ø')}
### ℹ️ Routes non présentes dans le menu
${(routesNotLinked.length? routesNotLinked.map(x=>`- ${x}`).join('\n'):'- Ø')}

## Graphe imports (esbuild)
- Entrées: ${entryPoints.map(norm).join(', ')}
- Build OK: ${meta? 'oui':'non'}
${buildErrors.length? `### Erreurs build\n`+buildErrors.map(e=>`- ${e}`).join('\n'): 'Aucune erreur esbuild'}

### Fichiers orphelins (non atteints depuis les entrées)
${(orphanFiles.length? orphanFiles.map(x=>`- ${x}`).join('\n') : '- Ø')}

## Supabase
- Fichiers avec appels: ${supaSummary.files}
### ❌ Embeds ambigus \`produit:produit_id(...)\` (vues)
${(supaSummary.embedProduitFiles.length? supaSummary.embedProduitFiles.map(x=>`- ${x}`).join('\n'):'- Ø')}
### ❌ Table annulée \`alertes_rupture\`
${(supaSummary.alertesTableFiles.length? supaSummary.alertesTableFiles.map(x=>`- ${x}`).join('\n'):'- Ø')}
### ❌ Filtre invalide \`traite\` sur \`v_alertes_rupture\`
${(supaSummary.traiteOnAlertesFiles.length? supaSummary.traiteOnAlertesFiles.map(x=>`- ${x}`).join('\n'):'- Ø')}
### ❌ Référence obsolète \`v_stock_theorique\`
${(supaSummary.vStockTheoriqueFiles.length? supaSummary.vStockTheoriqueFiles.map(x=>`- ${x}`).join('\n'):'- Ø')}
### URLs REST manuelles
${(supaSummary.restManualFiles.length? supaSummary.restManualFiles.map(x=>`- ${x}`).join('\n'):'- Ø')}

## TODO / FIXME / WIP
${(taskMarkers.length? taskMarkers.map(t=>`- ${t.file}:${t.line} → ${t.text}`).join('\n'):'- Ø')}

## Problèmes d'exports nommés
${(exportProblems.length? exportProblems.map(p=>`- ${p.file}: ${p.problem}`).join('\n'):'- Ø')}

---
### Recommandations immédiates
1) **Supprimer** les embeds sur les **vues** (ex: \`v_alertes_rupture\`), lire les colonnes directes.
2) **Remplacer** toute requête à la table \`alertes_rupture\` par la vue \`v_alertes_rupture\`.
3) **Retirer** tout filtre \`traite\` sur cette vue.
4) **Corriger** les exports nommés manquants (hooks).
5) **Archiver** les orphelins non utilisés (dossier \`_archive/\`) ou les reconnecter via le router/menu.
`;
await fs.writeFile(path.join(OUT_DIR,'AUDIT.md'), md, 'utf8');

console.log(pc.green('✅ Audit écrit :'));
console.log(' - ' + path.join(OUT_DIR,'audit-report.json'));
console.log(' - ' + path.join(OUT_DIR,'AUDIT.md'));
