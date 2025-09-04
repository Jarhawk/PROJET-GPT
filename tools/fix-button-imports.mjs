import fs from 'fs';
import path from 'path';
const ROOT = process.cwd();
const EXTS = new Set(['.js','.jsx','.ts','.tsx']);

function walk(dir, out=[]) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

function replaceAll(s, pairs) {
  let out = s;
  for (const [re, rep] of pairs) out = out.replace(re, rep);
  return out;
}

const files = walk(path.join(ROOT, 'src'));
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  let s = before;

  // Absolu via alias
  s = replaceAll(s, [
    [/(['"])@\/components\/ui\/Button\1/g, (m,q)=>`${q}@/components/ui/button${q}`],
    [/(['"])@\/components\/ui\/button\1/gi, (m,q)=>`${q}@/components/ui/button${q}`],
  ]);

  // Relatif
  s = replaceAll(s, [
    [/(['"])\.\/Button\1/g, (m,q)=>`${q}./button${q}`],
    [/(['"])..\/Button\1/g, (m,q)=>`${q}../button${q}`],
  ]);

  if (s !== before) {
    fs.writeFileSync(f, s, 'utf8');
    console.log('✔ fixed:', path.relative(ROOT, f));
  }
}
console.log('Done.');
