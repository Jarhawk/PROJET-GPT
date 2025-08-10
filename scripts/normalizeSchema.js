// scripts/normalizeSchema.js
import fs from 'node:fs';
import path from 'node:path';

const INPUTS = [
  path.resolve('db/full_setup.sql'),
  path.resolve('full_setup.sql'),
];
const OUT_SQL = path.resolve('db/full_setup_fixed.sql');
const OUT_REPORT = path.resolve('REPORTS/SCHEMA_NORMALIZE.md');

const sql = (() => {
  for (const p of INPUTS) if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  console.error('full_setup.sql introuvable. Place fichier sous db/full_setup.sql');
  process.exit(1);
})();

function splitStatements(text) {
  // Conserve $$ ... $$ blocks; split on ; outside $$.
  const out = [];
  let buf = '', inDollar = false;
  for (let i=0;i<text.length;i++){
    const ch = text[i], next2 = text.slice(i, i+2);
    if (!inDollar && next2 === '$$'){ inDollar = true; buf += '$$'; i++; continue; }
    if (inDollar && next2 === '$$'){ inDollar = false; buf += '$$'; i++; continue; }
    if (!inDollar && ch === ';'){ out.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter(s => s.length);
}

// Categorize statements
const CATS = {
  TABLE: [], FK: [], INDEX: [], TRIGGER: [], RLS: [], POLICY: [],
  GRANT: [], VIEW: [], FUNCTION: [], EXT: [], OTHER: []
};
const stmts = splitStatements(sql);

// helpers
const reCreatePolicy = /create\s+policy\s+(?:if\s+not\s+exists\s+)?([a-z0-9_"\[\]]+)\s+on\s+([a-z0-9_".]+)\s*(for\s+all|for\s+select|for\s+insert|for\s+update|for\s+delete)?\s*(using|with\s+check)?/i;
const reFnCall = /([a-z_][a-z0-9_]*)\s*\.\s*([a-z_][a-z0-9_]*)\s*\(/gi;
const reSchemaObj = /on\s+([a-z0-9_"]+)\.([a-z0-9_"]+)/i;

function classify(s){
  const t = s.toLowerCase();
  if (t.startsWith('create extension') || t.startsWith('alter extension')) return 'EXT';
  if (t.startsWith('create table')) return 'TABLE';
  if (t.startsWith('alter table') && t.includes(' add constraint ') && t.includes(' foreign key')) return 'FK';
  if (t.startsWith('create index') || t.startsWith('create unique index')) return 'INDEX';
  if (t.startsWith('create trigger') || (t.startsWith('drop trigger') && t.includes('create trigger'))) return 'TRIGGER';
  if (t.startsWith('alter table') && t.includes('enable row level security')) return 'RLS';
  if (t.startsWith('create policy') || (t.startsWith('do $$') && t.includes('pg_policies'))) return 'POLICY';
  if (t.startsWith('grant ')) return 'GRANT';
  if (t.startsWith('create or replace view') || t.startsWith('create view')) return 'VIEW';
  if (t.startsWith('create or replace function') || t.startsWith('create function') || (t.startsWith('do $$') && t.includes('pg_proc'))) return 'FUNCTION';
  return 'OTHER';
}

// track info
const report = { rewrittenPolicies: [], createdFnAliases: [], reordered: true, warnings: [] };

// 1) transform policies
function rewritePolicy(stmt){
  const m = stmt.match(reCreatePolicy);
  if (!m) return stmt;
  const polName = m[1].replace(/"/g,'');
  const onPart = m[2].replace(/"/g,''); // schema.table
  const [schema, table] = onPart.includes('.') ? onPart.split('.') : ['public', onPart];
  // Wrap full create policy in DO $$ if-not-exists
  const body = stmt.replace(/create\s+policy\s+(?:if\s+not\s+exists\s+)?/i, 'create policy ');
  const wrapped =
`do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='${schema}' and tablename='${table}' and policyname='${polName}'
  ) then
    ${body};
  end if;
end $$`;
  report.rewrittenPolicies.push(`${schema}.${table}:${polName}`);
  return wrapped;
}

// 2) find functions referenced by policies; create alias if missing
// We cannot query pg_proc here, so we prepare an idempotent DO $$ checker for each missing function.
const neededFns = new Map(); // key: schema.fn, value: aliasSpec
function collectPolicyFunctions(stmt){
  // Only scan policy bodies
  if (!/create\s+policy/i.test(stmt) && !/pg_policies/i.test(stmt)) return;
  let m; const seen = new Set();
  while ((m = reFnCall.exec(stmt)) !== null) {
    const schema = m[1], fn = m[2];
    const key = `${schema}.${fn}`;
    if (seen.has(key)) continue; seen.add(key);
    // ignore builtins/auth
    if (schema === 'pg' || schema === 'pgcrypto' || schema === 'auth') continue;
    neededFns.set(key, {schema, fn});
  }
}

stmts.forEach(s => collectPolicyFunctions(s));

// Prepare alias creators for selected known names
function aliasBlock(schema, fn, targetFn) {
  return `
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = '${schema}'
      and p.proname = '${fn}'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create or replace function ${schema}.${fn}()
    returns boolean
    language sql stable
    as $$ select ${targetFn}() $$;
    grant execute on function ${schema}.${fn}() to authenticated;
  end if;
end $$`.trim();
}
function stubBoolTrue(schema, fn) {
  return `
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = '${schema}'
      and p.proname = '${fn}'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create or replace function ${schema}.${fn}()
    returns boolean
    language sql stable
    as $$ select true $$;
    grant execute on function ${schema}.${fn}() to authenticated;
  end if;
end $$`.trim();
}

const aliasSnippets = [];
neededFns.forEach(({schema, fn}) => {
  // map to known aliases
  if (fn === 'current_user_is_admin') {
    aliasSnippets.push(aliasBlock(schema, fn, 'public.current_user_is_admin_or_manager'));
    report.createdFnAliases.push(`${schema}.${fn} -> public.current_user_is_admin_or_manager`);
  }
  // Add more known mappings if needed
});

// 3) apply policy rewrite and classify
const transformed = stmts.map(s => {
  if (/^\s*create\s+policy/i.test(s)) return rewritePolicy(s);
  return s;
});

transformed.forEach(s => {
  const cat = classify(s);
  CATS[cat] ? CATS[cat].push(s) : CATS.OTHER.push(s);
});

// 4) Build output in the desired order
const ORDER = ['EXT','TABLE','FK','INDEX','TRIGGER','RLS','POLICY','GRANT','VIEW','FUNCTION','OTHER'];
const header = `-- full_setup_fixed.sql (generated by scripts/normalizeSchema.js)
-- Order: TABLES → FKs → INDEXES → TRIGGERS → RLS → POLICIES → GRANTS → VIEWS → FUNCTIONS
-- This file is idempotent where possible.\n`;

const aliasSection = aliasSnippets.length
  ? `\n-- === Auto-created aliases for missing functions used in policies ===\n${aliasSnippets.join('\n\n')}\n`
  : '';

const outSql =
  header +
  ORDER.map(k => CATS[k].length ? `\n-- ===== ${k} =====\n` + CATS[k].join(';\n\n') + ';\n' : '').join('') +
  aliasSection;

fs.mkdirSync(path.dirname(OUT_SQL), { recursive: true });
fs.mkdirSync(path.dirname(OUT_REPORT), { recursive: true });
fs.writeFileSync(OUT_SQL, outSql.trim() + '\n');
fs.writeFileSync(OUT_REPORT,
  [
    '# SCHEMA NORMALIZE REPORT',
    '',
    `- Policies rewritten: ${report.rewrittenPolicies.length}`,
    report.rewrittenPolicies.length ? '  - ' + report.rewrittenPolicies.join('\n  - ') : '',
    '',
    `- Function aliases created: ${report.createdFnAliases.length}`,
    report.createdFnAliases.length ? '  - ' + report.createdFnAliases.join('\n  - ') : '',
    '',
    `- Reordered blocks: ${ORDER.join(' → ')}`,
    '',
    report.warnings.length ? '## Warnings\n' + report.warnings.join('\n') : ''
  ].join('\n')
);

console.log(`✅ Wrote ${OUT_SQL}`);
console.log(`📝 Report: ${OUT_REPORT}`);
