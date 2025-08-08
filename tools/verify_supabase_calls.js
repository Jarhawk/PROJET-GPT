/* eslint-env node */
import fs from 'fs';
import path from 'path';
import process from 'node:process';

const root = path.resolve(process.cwd());
const sqlPath = path.join(root, 'db', 'full_setup_final.sql');

let sql;
try {
  sql = fs.readFileSync(sqlPath, 'utf8');
} catch (err) {
  console.error(`Unable to read SQL file at ${sqlPath}:`, err);
  process.exit(1);
}

function parseResources(sql) {
  const tableRegex = /create\s+table\s+if\s+not\s+exists\s+public\.([a-zA-Z0-9_]+)/gi;
  const viewRegex = /create\s+(?:or\s+replace\s+)?view\s+public\.([a-zA-Z0-9_]+)/gi;
  const functionRegex = /create\s+(?:or\s+replace\s+)?function\s+public\.([a-zA-Z0-9_]+)/gi;

  const tables = [...sql.matchAll(tableRegex)].map(m => m[1]);
  const views = [...sql.matchAll(viewRegex)].map(m => m[1]);
  const funcs = [...sql.matchAll(functionRegex)].map(m => m[1]);

  return new Set([...tables, ...views, ...funcs]);
}

const definedResources = parseResources(sql);

function getSourceFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const supabasePattern = /supabase\.(?:from|rpc)\(['"]([^'"]+)['"]\)/g;
const srcDir = path.join(root, 'src');
const files = getSourceFiles(srcDir);

let missing = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = supabasePattern.exec(content)) !== null) {
    const resource = match[1];
    if (!definedResources.has(resource)) {
      missing.push(`${resource} -> ${path.relative(root, file)}`);
    }
  }
}

const outputPath = path.join(root, 'TO_FIX.txt');
const output = missing.length ? missing.join('\n') : 'No missing resources detected.';
fs.writeFileSync(outputPath, output + '\n');

console.log(output);
