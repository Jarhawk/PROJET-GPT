import { promises as fs } from 'fs';
import path from 'path';

async function walk(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (/[jt]sx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

(async () => {
  const files = await walk(path.join(process.cwd(), 'src'));
  const target = /supabase\.from\(['"]mouvements['"]\)/;
  let patches = [];
  for (const file of files) {
    const txt = await fs.readFile(file, 'utf8');
    if (target.test(txt)) {
      const rel = path.relative(process.cwd(), file);
      patches.push(`# File: ${rel}\n@@\n${txt.replace(target, "// TODO: remplacer mouvements")}\n`);
    }
  }
  if (patches.length) {
    await fs.writeFile('legacy_mouvements.patch', patches.join('\n'));
    console.log('Patch suggestions written to legacy_mouvements.patch');
  } else {
    console.log('No legacy mouvements references found');
  }
})();
