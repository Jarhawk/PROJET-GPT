import fs from 'fs';
import path from 'path';
const exts = new Set(['.jsx','.tsx']);
function* walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})) {
  const p = path.join(d,e.name);
  if(e.isDirectory()) yield* walk(p);
  else if(exts.has(path.extname(e.name))) yield p;
}}
const root = path.join(path.dirname(new URL(import.meta.url).pathname),'..','src');
let issues = [];
for (const f of walk(root)) {
  const s = fs.readFileSync(f,'utf8');
  if (/<label(?![^>]*htmlFor)/.test(s) || /<input(?![^>]*id=)/.test(s))
    issues.push(f);
}
console.log(JSON.stringify(issues,null,2));
