import fs from 'fs';
import path from 'path';

// Helper to split SQL into statements while keeping $$ blocks intact
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inDollar = false;
  for (let i = 0; i < sql.length; i++) {
    const two = sql.slice(i, i + 2);
    if (two === '$$') {
      inDollar = !inDollar;
      current += two;
      i++;
      continue;
    }
    const ch = sql[i];
    if (ch === ';' && !inDollar) {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

function normalizeIdent(str) {
  return str.replace(/"/g, '').toLowerCase();
}

function canonicalForm(name) {
  return name
    .split('_')
    .map((p) => p.replace(/s$/i, ''))
    .join('_');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const rootDir = path.resolve(process.cwd());
  const dbDir = path.join(rootDir, 'db');
  const reportDir = path.join(rootDir, 'REPORTS');

  const sourceFile = path.join(dbDir, 'full_setup.sql');
  const outputFile = path.join(dbDir, 'full_setup_fixed.sql');
  const reportFile = path.join(reportDir, 'SCHEMA_FIX.md');

  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sourceFile, 'utf8');
  let statements = splitSqlStatements(sql);

  const createdTables = new Set();
  const canonicalMap = {};
  const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_."]+)/i;

  statements.forEach((stmt) => {
    const m = stmt.match(tableRegex);
    if (m) {
      const full = normalizeIdent(m[1]);
      createdTables.add(full);
      const table = full.split('.')[1];
      const canon = canonicalForm(table);
      if (!canonicalMap[canon]) canonicalMap[canon] = full;
    }
  });

  // collect references
  const refTables = new Set();
  const refRegex = /(on|alter\s+table|references)\s+([a-zA-Z0-9_."]+)/gi;
  statements.forEach((stmt) => {
    let m;
    while ((m = refRegex.exec(stmt))) {
      const full = normalizeIdent(m[2]);
      refTables.add(full);
    }
  });

  const renames = {};
  const beforeBroken = [];
  for (const ref of refTables) {
    if (!createdTables.has(ref)) {
      const table = ref.split('.')[1];
      const canon = canonicalMap[canonicalForm(table)];
      if (canon) {
        renames[ref] = canon;
      } else {
        beforeBroken.push(ref);
      }
    }
  }

  // Apply renames
  const renameEntries = Object.entries(renames);
  statements = statements.map((stmt) => {
    let out = stmt;
    renameEntries.forEach(([from, to]) => {
      const fromNoSchema = from.split('.')[1];
      const toNoSchema = to.split('.')[1];
      out = out.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, 'g'), to);
      out = out.replace(new RegExp(`\\b${escapeRegExp(fromNoSchema)}\\b`, 'g'), toNoSchema);
    });
    return out;
  });

  // Recompute references after rename
  const afterBroken = [];
  const refTablesAfter = new Set();
  statements.forEach((stmt) => {
    let m;
    while ((m = refRegex.exec(stmt))) {
      const full = normalizeIdent(m[2]);
      refTablesAfter.add(full);
    }
  });
  refTablesAfter.forEach((ref) => {
    if (!createdTables.has(ref)) afterBroken.push(ref);
  });

  // Prepare additions
  const additions = [];
  const created = [];
  function addTable(name, ddl) {
    additions.push(ddl);
    createdTables.add(name);
    created.push(name);
  }

  if (!createdTables.has('public.mamas')) {
    addTable(
      'public.mamas',
      `create table if not exists public.mamas(
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)`
    );
  }

  if (!createdTables.has('public.zones_stock')) {
    addTable(
      'public.zones_stock',
      `create table if not exists public.zones_stock(
  id uuid primary key default gen_random_uuid(),
  mama_id uuid references public.mamas(id),
  type text,
  parent_id uuid references public.zones_stock(id),
  actif boolean default true,
  position int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)`
    );
  }

  if (!createdTables.has('public.produits_zones')) {
    addTable(
      'public.produits_zones',
      `create table if not exists public.produits_zones(
  id uuid primary key default gen_random_uuid(),
  produit_id uuid references public.produits(id) on delete cascade,
  zone_id uuid references public.zones_stock(id) on delete cascade,
  created_at timestamptz default now()
)`
    );
  }

  const produitsHasZone = statements.some(
    (s) => /alter\s+table\s+public\.produits\s+.*zone_id/i.test(s) || /zone_id/i.test(s) && /create\s+table\s+.*public\.produits/i.test(s)
  );
  if (!produitsHasZone) {
    additions.push(`alter table public.produits add column if not exists zone_id uuid;`);
    additions.push(`do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_produits_zone_id'
  ) then
    alter table public.produits add constraint fk_produits_zone_id foreign key (zone_id) references public.zones_stock(id) on delete set null;
  end if;
end $$`);
    additions.push(`create index if not exists idx_produits_zone_id on public.produits(zone_id)`);
    created.push('column produits.zone_id');
  }

  // Gather functions
  const createdFunctions = new Set();
  const fnRegex = /create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z0-9_."]+)/i;
  statements.forEach((stmt) => {
    const m = stmt.match(fnRegex);
    if (m) createdFunctions.add(normalizeIdent(m[1]));
  });

  // Policy rewrite
  const sections = {
    extensions: [],
    tables: [],
    columns: [],
    constraints: [],
    indexes: [],
    functions: [],
    triggers: [],
    rls: [],
    policies: [],
    views: [],
    grants: [],
    others: [],
  };

  let policyCount = 0;

  function categorize(stmt) {
    const lower = stmt.toLowerCase();
    if (lower.startsWith('create extension')) return sections.extensions.push(stmt);
    if (lower.startsWith('create table')) return sections.tables.push(stmt);
    if (lower.startsWith('alter table') && lower.includes('add column')) return sections.columns.push(stmt);
    if (lower.startsWith('alter table')) return sections.constraints.push(stmt);
    if (lower.startsWith('create index')) return sections.indexes.push(stmt);
    if (lower.startsWith('create or replace function') || lower.startsWith('create function')) return sections.functions.push(stmt);
    if (lower.startsWith('create trigger') || (lower.startsWith('do $$') && lower.includes('pg_trigger'))) return sections.triggers.push(stmt);
    if (lower.startsWith('alter table') && lower.includes('enable row level security')) return sections.rls.push(stmt);
    if (lower.startsWith('create policy')) {
      const m = stmt.match(/create\s+policy\s+([a-zA-Z0-9_"-]+)\s+on\s+([a-zA-Z0-9_."]+)/i);
      if (m) {
        const policy = m[1].replace(/"/g, '');
        const full = normalizeIdent(m[2]);
        const [schema, table] = full.split('.');
        const wrapped = `do $$\nbegin\n  if not exists (\n    select 1 from pg_policies where schemaname='${schema}' and tablename='${table}' and policyname='${policy}'\n  ) then\n    ${stmt};\n  end if;\nend $$`;
        sections.policies.push(wrapped);
        policyCount++;
        return;
      }
    }
    if (lower.startsWith('create view')) return sections.views.push(stmt);
    if (lower.startsWith('grant')) return sections.grants.push(stmt);
    sections.others.push(stmt);
  }

  statements.forEach(categorize);

  // prepend additions to tables
  if (additions.length) {
    sections.tables = [...additions, ...sections.tables];
  }

  // function aliases
  const aliasAdds = [];
  const needAdminAlias = statements.some((s) => /current_user_is_admin\s*\(/i.test(s));
  if (needAdminAlias && !createdFunctions.has('public.current_user_is_admin')) {
    aliasAdds.push(`do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'current_user_is_admin'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create or replace function public.current_user_is_admin()
    returns boolean
    language sql stable
    as $$ select public.current_user_is_admin_or_manager() $$;
    grant execute on function public.current_user_is_admin() to authenticated;
  end if;
end $$`);
  }
  if (aliasAdds.length) {
    sections.functions.push(...aliasAdds);
  }

  const out = [
    '-- File generated by scripts/normalizeSchema.js',
    '',
    '-- 1. Extensions',
    ...sections.extensions.map((s) => s + ';'),
    '',
    '-- 2. Tables',
    ...sections.tables.map((s) => s + ';'),
    '',
    '-- 3. Columns',
    ...sections.columns.map((s) => s + ';'),
    '',
    '-- 4. Constraints',
    ...sections.constraints.map((s) => s + ';'),
    '',
    '-- 5. Indexes',
    ...sections.indexes.map((s) => s + ';'),
    '',
    '-- 6. Functions',
    ...sections.functions.map((s) => s + ';'),
    '',
    '-- 7. Triggers',
    ...sections.triggers.map((s) => s + ';'),
    '',
    '-- 8. RLS Enable',
    ...sections.rls.map((s) => s + ';'),
    '',
    '-- 9. Policies',
    ...sections.policies.map((s) => s + ';'),
    '',
    '-- 10. Views',
    ...sections.views.map((s) => s + ';'),
    '',
    '-- 11. Grants',
    ...sections.grants.map((s) => s + ';'),
    '',
    '-- 12. Other',
    ...sections.others.map((s) => s + ';'),
    ''
  ].join('\n');

  const reportLines = [
    '# Schema Fix Report',
    '',
    '## Renames',
    ...Object.entries(renames).map(([f, t]) => `- ${f} → ${t}`),
    Object.keys(renames).length === 0 ? 'None' : '',
    '',
    '## Objects created',
    ...(created.length ? created.map((c) => `- ${c}`) : ['None']),
    '',
    `Policies rewritten: ${policyCount}`,
    '',
    '## Function aliases',
    ...(aliasAdds.length ? ['- current_user_is_admin → current_user_is_admin_or_manager'] : ['None']),
    '',
    '## Broken references before',
    ...(beforeBroken.length ? beforeBroken.map((b) => `- ${b}`) : ['None']),
    '',
    '## Broken references after',
    ...(afterBroken.length ? afterBroken.map((b) => `- ${b}`) : ['None']),
    ''
  ].join('\n');

  if (dryRun) {
    console.log('--- Proposed output ---');
    console.log(out);
    console.log('\n--- Report ---');
    console.log(reportLines);
    return;
  }

  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(outputFile, out + '\n');
  fs.writeFileSync(reportFile, reportLines + '\n');
  console.log('Schema normalization complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

