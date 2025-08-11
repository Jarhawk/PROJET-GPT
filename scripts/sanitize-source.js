import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const exts = new Set(['.js','.jsx','.ts','.tsx']);

function* walk(dir){
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    const p = path.join(dir,e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (exts.has(path.extname(e.name))) yield p;
  }
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname,'..','src');
let changed = 0;

for (const file of walk(srcDir)) {
  const raw = fs.readFileSync(file,'utf8');
  const clean = raw
    .replace(/\uFEFF/g,'')        // BOM
    .replace(/\u00A0/g,' ')       // NBSP
    .replace(/\u2028|\u2029/g,'\n'); // line sep
  if (clean !== raw) { fs.writeFileSync(file, clean, 'utf8'); changed++; }
}
console.log(changed ? `Sanitized ${changed} files` : 'No sanitation needed');
process.exitCode = 0;
