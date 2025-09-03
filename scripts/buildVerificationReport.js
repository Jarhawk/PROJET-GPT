import fs from 'fs';
const pagesReport = JSON.parse(fs.readFileSync(new URL('../pages_report.json', import.meta.url)));

function toPath(pageFile) {
  let p = pageFile.replace(/^pages\//, '').replace(/\.jsx?$/, '');
  const parts = p.split('/');
  const kebab = parts
    .map((seg) => (seg === 'index' ? '' : seg.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()))
    .filter(Boolean);
  return '/' + kebab.join('/');
}

const lines = pagesReport.pages
  .filter((p) => p.pageFile && !p.pageFile.includes('/public/LandingPage'))
  .map((p) => {
    const path = toPath(p.pageFile);
    const isPublic = /pages\/auth\/|pages\/public\/|pages\/NotFound\.jsx$/.test(p.pageFile);
    const showInSidebar = !isPublic && !/notfound|auth|public/i.test(p.pageFile);
    return `| ${path} | ${p.pageFile} | ${showInSidebar ? 'oui' : 'non'} |`;
  });

const content = `# Rapport de vérification\n\n## Pages\n\n| Path | Fichier | Sidebar |\n|---|---|---|\n${lines.join('\n')}\n\n## Requêtes modifiées\n- Ajout des clés i18n et accessKey dans routes.\n- Sidebar traduite via i18n.\n\n## Tests ajoutés\n- fiches.flow.test.jsx\n- factures.flow.test.jsx\n- inventaire.flow.test.jsx\n- menus.flow.test.jsx\n- taches.flow.test.jsx\n`;

fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/full_verification_report.md', content);
