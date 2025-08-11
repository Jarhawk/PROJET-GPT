import fs from 'fs/promises';
import glob from 'glob';
import { promisify } from 'util';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const globAsync = promisify(glob);

function isMember(node, name) {
  return (
    node.callee &&
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.property.name === name
  );
}

function findTableRecursive(obj) {
  if (!obj) return null;
  if (obj.type === 'CallExpression') {
    const callee = obj.callee;
    if (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      callee.property.name === 'from'
    ) {
      const arg = obj.arguments[0];
      if (arg && arg.type === 'StringLiteral') return arg.value;
    }
    return findTableRecursive(callee.object);
  } else if (obj.type === 'MemberExpression') {
    return findTableRecursive(obj.object);
  }
  return null;
}

function parseSelect(str, base) {
  const result = { [base]: new Set() };
  const stack = [base];
  let token = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '(') {
      const table = token.trim();
      if (table) {
        if (!result[table]) result[table] = new Set();
        stack.push(table);
      }
      token = '';
    } else if (c === ')') {
      if (token.trim()) result[stack[stack.length - 1]].add(token.trim());
      token = '';
      if (stack.length > 1) stack.pop();
    } else if (c === ',') {
      if (token.trim()) result[stack[stack.length - 1]].add(token.trim());
      token = '';
    } else {
      token += c;
    }
  }
  if (token.trim()) result[stack[stack.length - 1]].add(token.trim());
  return result;
}

async function scanFront() {
  const files = await globAsync('src/**/*.{js,jsx,ts,tsx}', {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/test/**',
      '**/__mocks__/**',
    ],
  });
  const tables = {};
  const functions = new Set();

  const ensureTable = name => {
    if (!tables[name]) tables[name] = { columns: new Set() };
  };

  for (const file of files) {
    const code = await fs.readFile(file, 'utf8');
    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });
    } catch (e) {
      console.warn('Parse error in', file, e.message);
      continue;
    }
    traverse(ast, {
      CallExpression(path) {
        const node = path.node;
        if (isMember(node, 'rpc')) {
          const arg = node.arguments[0];
          if (arg && arg.type === 'StringLiteral') functions.add(arg.value);
        }
        if (isMember(node, 'from')) {
          const arg = node.arguments[0];
          if (arg && arg.type === 'StringLiteral') ensureTable(arg.value);
        }
        if (isMember(node, 'select')) {
          const table = findTableRecursive(node.callee.object);
          const arg = node.arguments[0];
          if (table) ensureTable(table);
          if (arg && arg.type === 'StringLiteral' && table) {
            const map = parseSelect(arg.value, table);
            for (const [tbl, cols] of Object.entries(map)) {
              ensureTable(tbl);
              cols.forEach(c => tables[tbl].columns.add(c));
            }
          }
        }
      },
    });
  }
  return { tables, functions: Array.from(functions) };
}

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let tag = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (tag) {
      if (sql.startsWith(tag, i)) {
        current += tag;
        i += tag.length - 1;
        tag = null;
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '$') {
      const m = sql.slice(i).match(/^\$[^$]*\$/);
      if (m) {
        tag = m[0];
        current += tag;
        i += tag.length - 1;
        continue;
      }
    }
    if (ch === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

function splitComma(str) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseCreateTable(stmt, index) {
  const m = stmt.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i);
  if (!m) return;
  const name = m[1];
  if (!index.tables[name]) index.tables[name] = { columns: new Set() };
  const body = stmt.slice(stmt.indexOf('(') + 1, stmt.lastIndexOf(')'));
  const parts = splitComma(body);
  for (const p of parts) {
    const colMatch = p.match(/^"?([a-zA-Z0-9_]+)"?/);
    if (!colMatch) continue;
    const col = colMatch[1];
    if (/^constraint/i.test(p) || /foreign key/i.test(p)) {
      const fkMatch = p.match(/foreign key\s*\(([^)]+)\)\s*references\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
      if (fkMatch) {
        const fromCols = fkMatch[1].split(',').map(s => s.trim());
        const toTable = fkMatch[2];
        const toCols = fkMatch[3].split(',').map(s => s.trim());
        index.fks.push({ from: { table: name, columns: fromCols }, to: { table: toTable, columns: toCols } });
      }
      continue;
    }
    index.tables[name].columns.add(col);
    if (p.includes('references')) {
      const refMatch = p.match(/references\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
      if (refMatch) {
        const toTable = refMatch[1];
        const toCols = refMatch[2].split(',').map(s => s.trim());
        index.fks.push({ from: { table: name, columns: [col] }, to: { table: toTable, columns: toCols } });
      }
    }
  }
}

function parseAlterTable(stmt, index) {
  const m = stmt.match(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i);
  if (!m) return;
  const name = m[1];
  if (!index.tables[name]) index.tables[name] = { columns: new Set() };
  if (/add\s+column/i.test(stmt)) {
    const c = stmt.match(/add\s+column\s+(?:if\s+not\s+exists\s+)?"?([a-zA-Z0-9_]+)"?/i);
    if (c) index.tables[name].columns.add(c[1]);
  }
  if (/foreign key/i.test(stmt)) {
    const fkMatch = stmt.match(/foreign key\s*\(([^)]+)\)\s*references\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
    if (fkMatch) {
      const fromCols = fkMatch[1].split(',').map(s => s.trim());
      const toTable = fkMatch[2];
      const toCols = fkMatch[3].split(',').map(s => s.trim());
      index.fks.push({ from: { table: name, columns: fromCols }, to: { table: toTable, columns: toCols } });
    }
  }
}

function parseCreateView(stmt, index) {
  const m = stmt.match(/create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([a-zA-Z0-9_]+)(?:\s*\(([^)]+)\))?/i);
  if (!m) return;
  const name = m[1];
  const cols = m[2] ? m[2].split(',').map(s => s.trim()) : [];
  index.views[name] = { columns: new Set(cols) };
}

function parseCreateFunction(stmt, index) {
  const m = stmt.match(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)/i);
  if (!m) return;
  const name = m[1];
  const params = m[2].trim();
  const args = params ? params.split(',').filter(s => s.trim()).length : 0;
  index.functions[name] = args;
}

async function indexSQL() {
  const candidates = [
    'db/full_setup_final.sql',
    'db/full_setup_fixed.sql',
    'full_setup_final.sql',
    'full_setup.sql',
  ];
  let sqlFile = null;
  for (const p of candidates) {
    try {
      await fs.access(p);
      sqlFile = p;
      break;
    } catch {}
  }
  if (!sqlFile) throw new Error('SQL reference file not found');
  const sql = await fs.readFile(sqlFile, 'utf8');
  const statements = splitStatements(sql);
  const index = { tables: {}, views: {}, functions: {}, fks: [] };
  for (const stmt of statements) {
    const lower = stmt.toLowerCase();
    if (lower.startsWith('create table')) parseCreateTable(stmt, index);
    else if (lower.startsWith('alter table')) parseAlterTable(stmt, index);
    else if (lower.startsWith('create view') || lower.startsWith('create or replace view')) parseCreateView(stmt, index);
    else if (lower.startsWith('create function') || lower.startsWith('create or replace function')) parseCreateFunction(stmt, index);
  }
  return { index, sqlFile };
}

function compare(front, sqlIndex) {
  const missing = { tables: [], columns: {}, views: [], functions: [] };
  const mismatch = { fks: [], policies: [], views: [] };
  const unused = { tables: [], views: [], functions: [] };

  const frontTables = Object.keys(front.tables);
  for (const t of frontTables) {
    if (sqlIndex.tables[t]) {
      for (const col of front.tables[t].columns) {
        if (!sqlIndex.tables[t].columns.has(col)) {
          if (!missing.columns[t]) missing.columns[t] = [];
          missing.columns[t].push(col);
        }
      }
    } else if (sqlIndex.views[t]) {
      const viewCols = sqlIndex.views[t].columns;
      for (const col of front.tables[t].columns) {
        if (viewCols.size && !viewCols.has(col)) {
          if (!missing.columns[t]) missing.columns[t] = [];
          missing.columns[t].push(col);
        }
      }
    } else {
      if (t.startsWith('v_')) missing.views.push(t);
      else missing.tables.push(t);
    }
  }

  for (const fn of front.functions) {
    if (!sqlIndex.functions.find(f => f.name === fn)) missing.functions.push(fn);
  }

  const used = new Set(frontTables);
  for (const t of Object.keys(sqlIndex.tables)) {
    if (!used.has(t)) unused.tables.push(t);
  }
  for (const v of Object.keys(sqlIndex.views)) {
    if (!used.has(v)) unused.views.push(v);
  }
  for (const fn of sqlIndex.functions) {
    if (!front.functions.includes(fn.name)) unused.functions.push(fn.name);
  }

  for (const fk of sqlIndex.fks) {
    const src = sqlIndex.tables[fk.from.table];
    const dst = sqlIndex.tables[fk.to.table];
    const srcOk = src && fk.from.columns.every(c => src.columns.has(c));
    const dstOk = dst && fk.to.columns.every(c => dst.columns.has(c));
    if (!srcOk || !dstOk) mismatch.fks.push(fk);
  }

  return { missing, mismatch, unused };
}

function formatReportJSON(res, sqlIndex) {
  const tables = {};
  for (const [t, obj] of Object.entries(sqlIndex.tables)) {
    tables[t] = { columns: Array.from(obj.columns) };
  }
  const views = {};
  for (const [v, obj] of Object.entries(sqlIndex.views)) {
    views[v] = { columns: Array.from(obj.columns) };
  }
  const functions = Object.entries(sqlIndex.functions).map(([name, args]) => ({ name, args }));
  const fks = sqlIndex.fks;
  return { ...res, sqlIndex: { tables, views, functions, fks } };
}

function formatReportMD(res) {
  let md = '# Front / Back Alignment\n\n';
  md += '## Missing\n';
  md += '### Tables\n';
  res.missing.tables.forEach(t => { md += `- ${t}\n`; });
  md += '\n### Views\n';
  res.missing.views.forEach(v => { md += `- ${v}\n`; });
  md += '\n### Columns\n';
  for (const [t, cols] of Object.entries(res.missing.columns)) {
    md += `- ${t}: ${cols.join(', ')}\n`;
  }
  md += '\n### Functions\n';
  res.missing.functions.forEach(f => { md += `- ${f}\n`; });
  md += '\n## Mismatch\n';
  md += '### Foreign Keys\n';
  res.mismatch.fks.forEach(fk => {
    md += `- ${fk.from.table}(${fk.from.columns.join(',')}) -> ${fk.to.table}(${fk.to.columns.join(',')})\n`;
  });
  md += '\n### Policies\n';
  res.mismatch.policies.forEach(p => { md += `- ${p}\n`; });
  md += '\n### Views\n';
  res.mismatch.views.forEach(v => { md += `- ${v}\n`; });
  md += '\n## Unused\n';
  md += '### Tables\n';
  res.unused.tables.forEach(t => { md += `- ${t}\n`; });
  md += '\n### Views\n';
  res.unused.views.forEach(v => { md += `- ${v}\n`; });
  md += '\n### Functions\n';
  res.unused.functions.forEach(f => { md += `- ${f}\n`; });
  return md;
}

async function main() {
  const front = await scanFront();
  const { index } = await indexSQL();
  const res = compare(front, {
    tables: Object.fromEntries(Object.entries(index.tables).map(([k, v]) => [k, { columns: new Set(v.columns) }])),
    views: Object.fromEntries(Object.entries(index.views).map(([k, v]) => [k, { columns: new Set(v.columns) }])),
    functions: Object.entries(index.functions).map(([name, args]) => ({ name, args })),
    fks: index.fks,
  });
  const json = formatReportJSON(res, {
    tables: index.tables,
    views: index.views,
    functions: index.functions,
    fks: index.fks,
  });
  await fs.mkdir('REPORTS', { recursive: true });
  await fs.writeFile('REPORTS/FRONT_BACK_ALIGN.json', JSON.stringify(json, null, 2));
  const md = formatReportMD(res);
  await fs.writeFile('REPORTS/FRONT_BACK_ALIGN.md', md);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

