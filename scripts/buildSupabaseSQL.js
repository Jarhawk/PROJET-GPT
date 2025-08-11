import fs from 'fs';
import path from 'path';

// Determine input SQL file
const candidates = [
  'db/full_setup_final.sql',
  'db/full_setup_fixed.sql',
  'full_setup_final.sql',
  'full_setup.sql'
];
const inputFile = candidates.find(f => fs.existsSync(f));
if (!inputFile) {
  console.error('No SQL source file found');
  process.exit(1);
}

// Read inputs
const sqlSource = fs.readFileSync(inputFile, 'utf8');
const report = JSON.parse(fs.readFileSync('REPORTS/FRONT_BACK_ALIGN.json', 'utf8'));

// Tokenizer respecting $$ blocks
function tokenize(sql) {
  const tokens = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inDollar = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      current += ch;
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      current += ch;
      if (ch === '*' && next === '/') {
        current += '/';
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inDollar) {
      if (ch === '-' && next === '-') {
        inLineComment = true;
        current += ch + next;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        current += ch + next;
        i++;
        continue;
      }
    }

    if (!inSingle && !inDouble) {
      if (!inDollar && ch === '$' && next === '$') {
        inDollar = true;
        current += '$$';
        i++;
        continue;
      }
      if (inDollar && ch === '$' && next === '$') {
        inDollar = false;
        current += '$$';
        i++;
        continue;
      }
    }

    if (!inDouble && !inDollar && ch === "'") {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (!inSingle && !inDollar && ch === '"') {
      inDouble = !inDouble;
      current += ch;
      continue;
    }

    if (ch === ';' && !inSingle && !inDouble && !inDollar) {
      current += ch;
      if (current.trim()) tokens.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }
  if (current.trim()) tokens.push(current.trim());
  return tokens;
}

const statements = tokenize(sqlSource);

// Buckets
const buckets = {
  EXTENSIONS: [],
  FUNCTIONS: [],
  TABLES: [],
  ADDCOLUMNS: [],
  INDEXES: [],
  TRIGGERS: [],
  RLS_ENABLE: [],
  POLICIES: [],
  GRANTS: [],
  VIEWS: [],
  OTHER: []
};

const summary = {
  columnsAdded: [],
  policiesWrapped: [],
  constraintsWrapped: [],
  viewsTouched: [],
  functionAliases: [],
  cleanup: {
    tables: [],
    views: [],
    functions: []
  }
};

// Helper to categorize
function categorize(stmt) {
  const s = stmt.trim().toLowerCase();
  if (s.startsWith('create extension')) return 'EXTENSIONS';
  if (s.startsWith('create or replace function') || s.startsWith('create function')) return 'FUNCTIONS';
  if (s.startsWith('create table')) return 'TABLES';
  if (s.startsWith('alter table') && s.includes(' add column')) return 'ADDCOLUMNS';
  if (s.startsWith('create index') || s.startsWith('create unique index')) return 'INDEXES';
  if (s.startsWith('create trigger')) return 'TRIGGERS';
  if (s.startsWith('alter table') && s.includes(' enable row level security')) return 'RLS_ENABLE';
  if (s.startsWith('create policy')) return 'POLICIES';
  if (s.startsWith('grant')) return 'GRANTS';
  if (s.startsWith('create view') || s.startsWith('create or replace view')) return 'VIEWS';
  return 'OTHER';
}

// Track defined functions
const definedFunctions = new Set();

// Process statements
for (let stmt of statements) {
  let cat = categorize(stmt);

  // Normalize view creation
  if (cat === 'VIEWS') {
    stmt = stmt.replace(/^create\s+view/i, 'create or replace view');
    const m = stmt.match(/create or replace view\s+([^\s]+)\s+/i);
    if (m) summary.viewsTouched.push(m[1]);
  }

  // Wrap policies
  if (cat === 'POLICIES') {
    const m = stmt.match(/create\s+policy\s+([^\s]+)\s+on\s+([^\s]+)\s+(.*)/is);
    if (m) {
      const [_, pol, table, rest] = m;
      summary.policiesWrapped.push(`${pol} on ${table}`);
      stmt = `do $$\nbegin\n  if not exists (\n    select 1 from pg_policies\n    where schemaname='${table.includes('.') ? table.split('.')[0] : 'public'}'\n      and tablename='${table.includes('.') ? table.split('.')[1] : table}'\n      and policyname='${pol}'\n  ) then\n    create policy ${pol} on ${table} ${rest.trim()}\n;\n  end if;\nend$$;`;
    }
  }

  // Capture functions defined
  if (cat === 'FUNCTIONS') {
    const fm = stmt.match(/create\s+(?:or\s+replace\s+)?function\s+([^\s(]+)/i);
    if (fm) definedFunctions.add(fm[1].replace(/"/g, ''));
  }

  // Handle FK constraints
  if (cat === 'ADDCOLUMNS' || (cat === 'OTHER' && /foreign key/i.test(stmt))) {
    const fk = stmt.match(/alter\s+table\s+([^\s]+)\s+add\s+constraint\s+([^\s]+)\s+foreign\s+key\s*\(([^)]+)\)\s+references\s+([^\s(]+)\s*\(([^)]+)\)/i);
    if (fk) {
      const [, table, cname, col, refTable, refCol] = fk;
      const schema = table.includes('.') ? table.split('.')[0] : 'public';
      const tbl = table.includes('.') ? table.split('.')[1] : table;
      const column = col.trim();
      const refTbl = refTable;
      const refColumn = refCol.trim();
      // Determine type
      let type = 'uuid';
      if ((refTbl === 'public.utilisateurs' || refTbl === 'auth.users' || refTbl === 'public.mamas') && refColumn === 'id') {
        type = 'uuid';
      }
      const addCol = `do $$\nbegin\n  if not exists (\n    select 1 from information_schema.columns\n    where table_schema='${schema}' and table_name='${tbl}' and column_name='${column}'\n  ) then\n    alter table ${schema}.${tbl} add column ${column} ${type};\n  end if;\nend$$;`;
      const addFk = `do $$\nbegin\n  if not exists (\n    select 1 from pg_constraint where conname='${cname}'\n  ) then\n    alter table ${schema}.${tbl} add constraint ${cname} foreign key (${column}) references ${refTable}(${refColumn});\n  end if;\nend$$;`;
      summary.columnsAdded.push(`${schema}.${tbl}.${column} -> ${refTable}(${refColumn})`);
      summary.constraintsWrapped.push(cname);
      buckets.ADDCOLUMNS.push(addCol);
      buckets.ADDCOLUMNS.push(addFk);
      continue;
    }
  }

  buckets[cat].push(stmt);
}

// Functions used in policies
const policyFuncs = new Set();
for (const pol of summary.policiesWrapped) {
  const original = statements.find(s => s.includes(pol.split(' on ')[0]));
  if (original) {
    const matches = original.match(/public\.(\w+)\s*\(/g);
    if (matches) {
      matches.forEach(m => policyFuncs.add('public.' + m.match(/public\.(\w+)\s*\(/)[1]));
    }
  }
}

for (const fn of policyFuncs) {
  if (!definedFunctions.has(fn)) {
    if (fn.endsWith('current_user_is_admin') && definedFunctions.has('public.current_user_is_admin_or_manager')) {
      const alias = `create or replace function ${fn}()\nreturns boolean\nlanguage sql stable\nas $$\n  select public.current_user_is_admin_or_manager()\n$$;`;
      buckets.FUNCTIONS.push(alias);
      summary.functionAliases.push(`${fn} alias current_user_is_admin_or_manager`);
      definedFunctions.add(fn);
    } else {
      const stub = `create or replace function ${fn}()\nreturns boolean\nlanguage sql stable\nas $$\n  select true\n$$;`;
      buckets.FUNCTIONS.push(stub);
      summary.functionAliases.push(`${fn} stubbed`);
      definedFunctions.add(fn);
    }
  }
}

// RLS enable and grants
const usedTables = Object.keys(report.sqlIndex?.tables || {});
const usedFunctions = (report.sqlIndex?.functions || []).map(f => f.name);

usedTables.forEach(t => {
  buckets.RLS_ENABLE.push(`alter table if exists public.${t} enable row level security;`);
  buckets.GRANTS.push(`grant select, insert, update, delete on table public.${t} to authenticated;`);
});

usedFunctions.filter(f => !report.unused?.functions?.includes(f)).forEach(f => {
  const fn = report.sqlIndex.functions.find(x => x.name === f);
  if (fn && fn.args === 0) {
    buckets.GRANTS.push(`grant execute on function public.${f}() to authenticated;`);
  }
});

// Cleanup block
const withCleanup = process.argv.includes('--with-cleanup');
if (withCleanup) {
  summary.cleanup.views = report.unused?.views || [];
  summary.cleanup.functions = report.unused?.functions || [];
  summary.cleanup.tables = report.unused?.tables || [];
}

function buildCleanup() {
  let out = '-- CLEANUP BEGIN\n';
  summary.cleanup.views.forEach(v => {
    out += `-- drop view if exists public.${v} cascade;\n`;
  });
  summary.cleanup.functions.forEach(f => {
    out += `-- drop function if exists public.${f} cascade;\n`;
  });
  summary.cleanup.tables.forEach(t => {
    out += `-- drop table if exists public.${t} cascade;\n`;
  });
  out += '-- CLEANUP END';
  return out;
}

// Build final SQL
const order = ['EXTENSIONS','FUNCTIONS','TABLES','ADDCOLUMNS','INDEXES','TRIGGERS','RLS_ENABLE','POLICIES','GRANTS','VIEWS','OTHER'];
let finalSQL = order.map(k => buckets[k].join('\n\n')).filter(Boolean).join('\n\n');
if (withCleanup && (summary.cleanup.views.length || summary.cleanup.functions.length || summary.cleanup.tables.length)) {
  finalSQL += '\n\n' + buildCleanup() + '\n';
}

fs.writeFileSync('db/full_setup_ONE.sql', finalSQL.trim() + '\n');

// Summary report
function writeSummary() {
  let md = '# SQL Build Summary\n\n';
  md += '## Columns added for FKs\n';
  if (summary.columnsAdded.length) summary.columnsAdded.forEach(c => md += `- ${c}\n`); else md += 'None\n';
  md += '\n## Policies wrapped\n';
  if (summary.policiesWrapped.length) summary.policiesWrapped.forEach(p => md += `- ${p}\n`); else md += 'None\n';
  md += '\n## Constraints wrapped\n';
  if (summary.constraintsWrapped.length) summary.constraintsWrapped.forEach(c => md += `- ${c}\n`); else md += 'None\n';
  md += '\n## Views touched\n';
  if (summary.viewsTouched.length) summary.viewsTouched.forEach(v => md += `- ${v}\n`); else md += 'None\n';
  md += '\n## Functions aliased/stubbed\n';
  if (summary.functionAliases.length) summary.functionAliases.forEach(f => md += `- ${f}\n`); else md += 'None\n';
  md += '\n## Execution order\n';
  md += order.join(' -> ') + '\n';
  if (withCleanup) {
    md += '\n## Cleanup suggestions\n';
    if (summary.cleanup.views.length) md += '- Views: ' + summary.cleanup.views.join(', ') + '\n';
    if (summary.cleanup.functions.length) md += '- Functions: ' + summary.cleanup.functions.join(', ') + '\n';
    if (summary.cleanup.tables.length) md += '- Tables: ' + summary.cleanup.tables.join(', ') + '\n';
    if (!summary.cleanup.views.length && !summary.cleanup.functions.length && !summary.cleanup.tables.length) md += 'None\n';
  }
  fs.writeFileSync('REPORTS/SQL_BUILD_SUMMARY.md', md);
}

writeSummary();
