#!/usr/bin/env node
/* Auto-fix limité et sûr :
   - Remplace select embed sur v_alertes_rupture par select direct des colonnes
   - Supprime filtre 'traite' sur v_alertes_rupture
   - Remplace table 'alertes_rupture' par 'v_alertes_rupture'
   - Ne touche qu’aux .js/.jsx/.ts/.tsx dans src/
*/
import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import pc from 'picocolors';

const ROOT = process.cwd();
const files = await fg(['src/**/*.{js,jsx,ts,tsx}'], { cwd: ROOT, absolute: true });
const changes = [];

for (const abs of files) {
  const p = abs;
  let txt = await fs.readFile(p,'utf8');
  const before = txt;

  // 1) embed produit:produit_id -> select direct pour v_alertes_rupture
  //   supabase builder
  txt = txt.replace(
    \.from\(['"`]v_alertes_rupture['"`]\)\s*\.select\((['"`])\*[^'"`]*produit\s*:\s*produit_id\([^'"`]*\)\1/g,
    `.from('v_alertes_rupture').select('produit_id, nom, unite, fournisseur_id, fournisseur_nom, stock_actuel, stock_min, manque'`
  );
  //   REST URL
  txt = txt.replace(
    /\/rest\/v1\/v_alertes_rupture\?select=[^&\n]*produit:produit_id\([^)]+\)[^'"\n]*/g,
    `/rest/v1/v_alertes_rupture?select=produit_id,nom,unite,fournisseur_id,fournisseur_nom,stock_actuel,stock_min,manque`
  );

  // 2) enlever &traite=... et .eq('traite', false)
  txt = txt.replace(/&?traite=eq\.false/g, '');
  txt = txt.replace(/\.eq\(\s*['"]traite['"]\s*,\s*false\s*\)/g, '');

  // 3) remplacer table alertes_rupture par vue v_alertes_rupture (builder)
  txt = txt.replace(/\.from\(['"]alertes_rupture['"]\)/g, `.from('v_alertes_rupture')`);

  // 4) tri par manque desc garanti si on requête la vue
  txt = txt.replace(
    \.from\(['"]v_alertes_rupture['"]\)([^;]+?)\.order\(\s*['"]manque['"]\s*,\s*{?\s*ascending\s*:\s*true\s*}?\s*\)/g,
    `.from('v_alertes_rupture')$1.order('manque', { ascending: false })`
  );

  if (txt !== before) {
    await fs.writeFile(p, txt, 'utf8');
    changes.push(path.relative(ROOT,p));
  }
}

if (!changes.length) {
  console.log(pc.yellow('Aucun changement appliqué.'));
} else {
  console.log(pc.green('Changements appliqués :'));
  changes.forEach(f => console.log(' - ' + f));
  console.log(pc.gray('→ Vérifie audit/AUDIT.md puis relance le build.'));
}
