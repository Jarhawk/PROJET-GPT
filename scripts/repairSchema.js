#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import pg from 'pg';

// Helper to split SQL statements while keeping $$ bodies intact
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;
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
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }
    if (!inSingle && !inDouble && !dollarTag) {
      if (ch === '-' && next === '-') {
        inLineComment = true;
        current += ch;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        current += ch;
        continue;
      }
    }
    if (!inDouble && !dollarTag && ch === '\'' && sql[i - 1] !== '\\') {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (!inSingle && !dollarTag && ch === '"' && sql[i - 1] !== '\\') {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (!inSingle && !inDouble) {
      if (!dollarTag && ch === '$') {
        const tagMatch = sql.slice(i).match(/^\$[\w]*\$/);
        if (tagMatch) {
          dollarTag = tagMatch[0];
          current += dollarTag;
          i += dollarTag.length - 1;
          continue;
        }
      } else if (dollarTag && sql.slice(i).startsWith(dollarTag)) {
        current += dollarTag;
        i += dollarTag.length - 1;
        dollarTag = null;
        continue;
      }
    }
    if (!inSingle && !inDouble && !dollarTag && ch === ';') {
      current += ch;
      statements.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);
  return statements;
}

function splitByComma(body) {
  const parts = [];
  let current = '';
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (!inDouble && ch === '\'' && body[i - 1] !== '\\') inSingle = !inSingle;
    else if (!inSingle && ch === '"' && body[i - 1] !== '\\') inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function cleanIdent(ident) {
  return ident.replace(/"/g, '').trim();
}

function parseColumn(colDef) {
  const tokens = colDef.trim().split(/\s+/);
  const name = cleanIdent(tokens[0]);
  const type = tokens.slice(1).join(' ');
  return { name, type: type.trim() };
}

function parseFk(def, table) {
  const fk = { table, options: '', source: 'inline' };
  const refMatch = def.match(/references\s+([^\s(]+)(\s*\(([^)]*)\))?(.*)$/i);
  const localMatch = def.match(/foreign\s+key\s*\(([^)]*)\)/i);
  if (!refMatch || !localMatch) return null;
  fk.localCols = localMatch[1].split(',').map(s => cleanIdent(s));
  const refTable = cleanIdent(refMatch[1]);
  if (refTable.includes('.')) {
    const [schema, table] = refTable.split('.');
    fk.refSchema = schema;
    fk.refTable = table;
  } else {
    fk.refSchema = 'public';
    fk.refTable = refTable;
  }
  if (refMatch[3]) fk.refCols = refMatch[3].split(',').map(s => cleanIdent(s));
  fk.options = (refMatch[4] || '').trim();
  const nameMatch = def.match(/constraint\s+([\w_]+)/i);
  if (nameMatch) fk.name = nameMatch[1];
  return fk;
}

function parseStatements(statements) {
  const tables = {};
  const tableOrder = [];
  const fks = [];
  const extensions = [];
  const others = [];
  for (const stmt of statements) {
    const stmtNC = stmt.replace(/^--.*$/gm, '').trim();
    const ctMatch = stmtNC.match(/^create\s+table\s+(?:if\s+not\s+exists\s+)?([^\s(]+)\s*\(([\s\S]*)\)\s*;?$/i);
    if (ctMatch) {
      const fullName = cleanIdent(ctMatch[1]);
      let schema = 'public';
      let table = fullName;
      if (fullName.includes('.')) {
        [schema, table] = fullName.split('.');
      }
      const body = ctMatch[2];
      const parts = splitByComma(body);
      const columns = {};
      const pk = [];
      const retainedParts = [];
      for (const part of parts) {
        if (/foreign\s+key/i.test(part)) {
          const fk = parseFk(part, { schema, table });
          if (fk) {
            fk.inlineChunk = part.trim();
            fk.inlineIndex = retainedParts.length;
            fks.push(fk);
            retainedParts.push(part.trim());
          }
          continue;
        } else if (/^(constraint\s+[\w_]+\s+)?primary\s+key/i.test(part.trim())) {
          const pkMatch = part.match(/\(([^)]*)\)/);
          if (pkMatch) {
            pk.push(...pkMatch[1].split(',').map(s => cleanIdent(s)));
          }
          retainedParts.push(part.trim());
        } else {
          const col = parseColumn(part);
          columns[col.name] = { type: col.type };
          retainedParts.push(part.trim());
        }
      }
      const key = `${schema}.${table}`;
      tables[key] = { schema, table, columns, pk, parts: retainedParts };
      tableOrder.push(key);
      continue;
    }
    let matchedFk = false;
    const fkAlterRegex = /alter\s+table\s+(?:if\s+exists\s+)?([^\s]+)\s+add\s+constraint\s+([\w_]+)\s+foreign\s+key\s*\(([^)]*)\)\s+references\s+([^\s(]+)(\s*\(([^)]*)\))?(.*?);/ig;
    let fkAlterMatch;
    while ((fkAlterMatch = fkAlterRegex.exec(stmtNC)) !== null) {
      let fullLocal = cleanIdent(fkAlterMatch[1]);
      let localSchema = 'public';
      let localTable = fullLocal;
      if (fullLocal.includes('.')) [localSchema, localTable] = fullLocal.split('.');
      const fk = {
        table: { schema: localSchema, table: localTable },
        name: fkAlterMatch[2],
        localCols: fkAlterMatch[3].split(',').map(s => cleanIdent(s)),
        refTable: cleanIdent(fkAlterMatch[4]),
        options: (fkAlterMatch[7] || '').trim(),
        source: 'alter'
      };
      if (fkAlterMatch[6]) fk.refCols = fkAlterMatch[6].split(',').map(s => cleanIdent(s));
      if (fk.refTable.includes('.')) {
        const [rs, rt] = fk.refTable.split('.');
        fk.refSchema = rs;
        fk.refTable = rt;
      } else {
        fk.refSchema = 'public';
      }
      fks.push(fk);
      matchedFk = true;
    }
    if (matchedFk) continue;
    if (/^create\s+extension/i.test(stmtNC)) {
      extensions.push(stmtNC);
    } else {
      others.push(stmtNC || stmt);
    }
  }
  return { tables, tableOrder, fks, extensions, others };
}

function resolveFkTypes(fk, tables, columnAdditions, reportEntry) {
  fk.refCols = fk.refCols && fk.refCols.length ? fk.refCols : null;
  const refKey = `${fk.refSchema}.${fk.refTable}`;
  const refTable = tables[refKey];
  if (!refTable) {
    reportEntry.status.push('ERROR: referenced table not found');
    fk.skip = true;
    return;
  }
  if (!fk.refCols) {
    if (refTable.pk.length > 0) {
      fk.refCols = refTable.pk;
    } else {
      reportEntry.status.push('ERROR: referenced columns unknown');
      fk.skip = true;
      return;
    }
  }
  if (fk.refCols.some(c => !refTable.columns[c])) {
    reportEntry.status.push('ERROR: referenced column missing');
    fk.skip = true;
    return;
  }
  fk.localCols.forEach((col, idx) => {
    const tableKey = `${fk.table.schema}.${fk.table.table}`;
    const t = tables[tableKey];
    if (!t.columns[col]) {
      const refCol = refTable.columns[fk.refCols[idx]];
      const refColType = refCol ? refCol.type : 'uuid';
      const colType = refColType.split(/\s+/)[0];
      columnAdditions.push({
        schema: fk.table.schema,
        table: fk.table.table,
        column: col,
        type: colType,
        ref: `${fk.refSchema}.${fk.refTable}(${fk.refCols[idx]})`
      });
      t.columns[col] = { type: colType };
      reportEntry.status.push(`ADDED COLUMN ${col} ${colType}`);
      if (fk.source === 'inline') {
        fk.needsMove = true;
        const tkey = `${fk.table.schema}.${fk.table.table}`;
        const tbl = tables[tkey];
        if (fk.inlineIndex != null) tbl.parts[fk.inlineIndex] = null;
      }
    }
  });
}

function generateFkName(fk, usedNames) {
  if (fk.name) {
    usedNames.add(fk.name);
    return fk.name;
  }
  let base = `fk_${fk.table.table}_${fk.localCols.join('_')}__${fk.refTable}_${fk.refCols.join('_')}`;
  base = base.toLowerCase();
  let name = base;
  let i = 1;
  while (usedNames.has(name)) {
    name = `${base}_${i++}`;
  }
  usedNames.add(name);
  fk.name = name;
  return name;
}

function buildCreateTableStatement(tbl) {
  const parts = tbl.parts.filter(p => p);
  return `create table if not exists ${tbl.schema}.${tbl.table} (\n  ${parts.join(',\n  ')}\n);`;
}

function buildAddColumnBlock(add) {
  const { schema, table, column, type } = add;
  return `DO $$\nBEGIN\n  IF NOT EXISTS (\n    SELECT 1 FROM information_schema.columns\n    WHERE table_schema='${schema}' AND table_name='${table}' AND column_name='${column}'\n  ) THEN\n    ALTER TABLE ${schema}.${table} ADD COLUMN ${column} ${type};\n  END IF;\nEND $$;`;
}

function buildAddFkBlock(fk) {
  const { schema, table } = fk.table;
  const localCols = fk.localCols.join(', ');
  const refTable = `${fk.refSchema}.${fk.refTable}`;
  const refCols = fk.refCols.join(', ');
  const options = fk.options ? ' ' + fk.options : '';
  return `DO $$\nBEGIN\n  IF NOT EXISTS (\n    SELECT 1 FROM pg_constraint c\n    JOIN pg_class cl ON cl.oid = c.conrelid\n    JOIN pg_namespace n ON n.oid = cl.relnamespace\n    WHERE c.contype='f' AND c.conname='${fk.name}'\n      AND n.nspname='${schema}' AND cl.relname='${table}'\n  ) THEN\n    ALTER TABLE ${schema}.${table}\n      ADD CONSTRAINT ${fk.name}\n      FOREIGN KEY (${localCols}) REFERENCES ${refTable}(${refCols})${options};\n  END IF;\nEND $$;`;
}

function categorizeOthers(others) {
  const categories = { indexes: [], functions: [], triggers: [], rls: [], policies: [], views: [], grants: [], misc: [] };
  for (const stmt of others) {
    const s = stmt.trim();
    if (/^create\s+(unique\s+)?index/i.test(s)) categories.indexes.push(s);
    else if (/^create\s+(or\s+replace\s+)?function/i.test(s)) categories.functions.push(s);
    else if (/^create\s+trigger/i.test(s)) categories.triggers.push(s);
    else if (/^alter\s+table\s+.*enable\s+row\s+level\s+security/i.test(s)) categories.rls.push(s);
    else if (/^create\s+policy/i.test(s)) categories.policies.push(s);
    else if (/^create\s+view/i.test(s)) categories.views.push(s);
    else if (/^grant/i.test(s)) categories.grants.push(s);
    else categories.misc.push(s);
  }
  return categories;
}

function buildPolicyBlock(stmt, report, final, dry) {
  const m = stmt.match(/^create\s+policy\s+([^\s]+)\s+on\s+([^\s]+)([\s\S]*)$/i);
  if (!m) {
    final.push(stmt);
    dry.push(stmt);
    return;
  }
  const policy = cleanIdent(m[1]);
  let tableFull = cleanIdent(m[2]);
  let schema = 'public';
  let table = tableFull;
  if (tableFull.includes('.')) [schema, table] = tableFull.split('.');
  const rest = m[3].trim().replace(/;$/, '');
  const block = `ALTER TABLE ${schema}.${table} ENABLE ROW LEVEL SECURITY;\nDO $$\nBEGIN\n  IF NOT EXISTS (\n    SELECT 1 FROM pg_policies\n    WHERE schemaname='${schema}' AND tablename='${table}' AND policyname='${policy}'\n  ) THEN\n    CREATE POLICY ${policy} ON ${schema}.${table}\n      ${rest};\n  END IF;\nEND $$;`;
  final.push(block);
  dry.push(`-- [FIX] Make policy ${policy} idempotent\n${block}`);
  report.policies.push(`${schema}.${table}.${policy}`);
}

function buildViewBlock(stmt, report, final, dry) {
  const m = stmt.match(/^create\s+view\s+([^\s]+)\s+as\s+([\s\S]*)$/i);
  if (!m) {
    final.push(stmt);
    dry.push(stmt);
    return;
  }
  const view = cleanIdent(m[1]);
  const body = m[2].trim().replace(/;$/, '');
  const block = `DROP VIEW IF EXISTS ${view} CASCADE;\nCREATE VIEW ${view} AS\n${body};`;
  final.push(block);
  dry.push(`-- [FIX] Recreate view ${view}\n${block}`);
  report.views.push(view);
}

function buildTriggerBlock(stmt, report, final, dry) {
  const m = stmt.match(/^create\s+trigger\s+([^\s]+)\s+([\s\S]*)$/i);
  if (!m) {
    final.push(stmt);
    dry.push(stmt);
    return;
  }
  const name = cleanIdent(m[1]);
  const rest = m[2].trim().replace(/;$/, '');
  const block = `DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='${name}') THEN\n    CREATE TRIGGER ${name} ${rest};\n  END IF;\nEND $$;`;
  final.push(block);
  dry.push(`-- [FIX] Ensure trigger ${name}\n${block}`);
  report.triggers.push(name);
}

function ensureAdminAlias(functions, report, final, dry) {
  const hasAdmin = functions.some(f => /current_user_is_admin\s*\(\)/i.test(f));
  const hasTarget = functions.some(f => /current_user_is_admin_or_manager\s*\(\)/i.test(f));
  if (!hasAdmin && hasTarget) {
    const block = `DO $$\nBEGIN\n  IF NOT EXISTS (\n    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace\n    WHERE n.nspname='public' AND p.proname='current_user_is_admin'\n      AND pg_get_function_identity_arguments(p.oid)=''\n  ) THEN\n    CREATE OR REPLACE FUNCTION public.current_user_is_admin()\n    RETURNS boolean LANGUAGE sql STABLE\n    AS $$ SELECT public.current_user_is_admin_or_manager() $$;\n    GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;\n  END IF;\nEND $$;`;
    final.push(block);
    dry.push(`-- [FIX] Create alias function current_user_is_admin()\n${block}`);
    report.functions.push('current_user_is_admin');
  }
}

async function detectCleanup(whitelist, options) {
  const reportLines = [];
  const extraTables = [];
  const dropOrder = [];
  const cleanupStatements = [];
  if (!options.dbUrl) {
    reportLines.push('No database connection string provided; skipping cleanup.');
    return { reportLines, extraTables, dropOrder, cleanupStatements };
  }
  let client;
  try {
    client = new pg.Client({ connectionString: options.dbUrl });
    await client.connect();
    const res = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'");
    const existing = res.rows.map(r => r.tablename);
    const keepAlways = options.keepAlways || [];
    existing.forEach(t => {
      if (!whitelist.has(`public.${t}`) && !keepAlways.includes(t) && !t.startsWith('pg_')) {
        extraTables.push(t);
      }
    });
    if (extraTables.length) {
      const fkRes = await client.query(`SELECT tc.table_name AS table_name, ccu.table_name AS ref_table\n        FROM information_schema.table_constraints tc\n        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name\n        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'`);
      const graph = new Map();
      extraTables.forEach(t => graph.set(t, []));
      fkRes.rows.forEach(r => {
        if (graph.has(r.ref_table) && graph.has(r.table_name)) {
          graph.get(r.ref_table).push(r.table_name);
        }
      });
      const visited = new Set();
      function dfs(node) {
        if (visited.has(node)) return;
        visited.add(node);
        for (const child of graph.get(node)) dfs(child);
        dropOrder.push(node);
      }
      extraTables.forEach(t => dfs(t));
      dropOrder.forEach(t => {
        cleanupStatements.push(`-- [CLEANUP] Dropping extra table (not in whitelist)\nDROP TABLE IF EXISTS public.${t} CASCADE;`);
      });
    }
    await client.end();
  } catch (err) {
    reportLines.push('Cleanup scan failed: ' + err.message);
    if (client) await client.end();
  }
  return { reportLines, extraTables, dropOrder, cleanupStatements };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply') || process.env.SCHEMA_APPLY === '1';
  const rootDir = path.resolve(process.cwd());
  const dbDir = path.join(rootDir, 'db');
  const reportDir = path.join(rootDir, 'REPORTS');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const preferred = path.join(dbDir, 'full_setup_fixed.sql');
  const fallback = path.join(dbDir, 'full_setup.sql');
  const sourceFile = fs.existsSync(preferred) ? preferred : fallback;
  if (!fs.existsSync(sourceFile)) {
    console.error('Source SQL file not found');
    process.exit(1);
  }
  const sql = fs.readFileSync(sourceFile, 'utf8');
  const statements = splitSqlStatements(sql);
  const { tables, tableOrder, fks, extensions, others } = parseStatements(statements);

  const columnAdditions = [];
  const fkBlocks = [];
  const report = { columns: [], fks: [], views: [], policies: [], functions: [], triggers: [] };
  const usedFkNames = new Set();

  for (const fk of fks) {
    const reportEntry = { status: [] };
    resolveFkTypes(fk, tables, columnAdditions, reportEntry);
    if (!fk.skip) {
      generateFkName(fk, usedFkNames);
      fkBlocks.push(buildAddFkBlock(fk));
      report.fks.push(`${fk.table.schema}.${fk.table.table}(${fk.localCols.join(',')}) -> ${fk.refSchema}.${fk.refTable}(${fk.refCols.join(',')})`);
    }
    if (reportEntry.status.some(s => s.startsWith('ADDED COLUMN'))) {
      report.columns.push(`${fk.table.schema}.${fk.table.table}(${fk.localCols.join(',')})`);
    }
  }

  const createTableStmts = tableOrder.map(key => buildCreateTableStatement(tables[key]));

  const addColumnBlocks = columnAdditions.map(add => {
    const block = buildAddColumnBlock(add);
    return { block, dry: `-- [FIX] Add column ${add.table}.${add.column}\n${block}` };
  });

  const categories = categorizeOthers(others);
  const finalStatements = [];
  const dryStatements = [];

  // Extensions
  extensions.forEach(s => { finalStatements.push(s); dryStatements.push(s); });

  // Tables
  createTableStmts.forEach(s => { finalStatements.push(s); dryStatements.push(s); });

  // Columns
  addColumnBlocks.forEach(({ block, dry }) => { finalStatements.push(block); dryStatements.push(dry); });

  // Indexes
  categories.indexes.forEach(s => { finalStatements.push(s); dryStatements.push(s); });

  // Functions
  categories.functions.forEach(s => { finalStatements.push(s); dryStatements.push(s); });
  ensureAdminAlias(categories.functions, report, finalStatements, dryStatements);

  // Triggers
  categories.triggers.forEach(s => buildTriggerBlock(s, report, finalStatements, dryStatements));

  // RLS
  categories.rls.forEach(s => { finalStatements.push(s); dryStatements.push(s); });

  // Policies
  categories.policies.forEach(s => buildPolicyBlock(s, report, finalStatements, dryStatements));

  // Views
  categories.views.forEach(s => buildViewBlock(s, report, finalStatements, dryStatements));

  // Grants
  categories.grants.forEach(s => { finalStatements.push(s); dryStatements.push(s); });

  // Misc
  categories.misc.forEach(s => { finalStatements.push(s); dryStatements.push(s); });

  // Foreign keys at end
  fkBlocks.forEach(block => {
    finalStatements.push(block);
    dryStatements.push(`-- [FIX] Ensure foreign key\n${block}`);
  });

  const repairedSql = finalStatements.join('\n\n') + '\n';
  const drySql = dryStatements.join('\n\n') + '\n';
  fs.writeFileSync(path.join(dbDir, 'full_setup_repaired.sql'), repairedSql);
  fs.writeFileSync(path.join(dbDir, 'full_setup_repaired.dryrun.sql'), drySql);

  // Cleanup detection
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.DB_URL;
  const keepAlways = (process.env.KEEP_ALWAYS || '').split(',').map(s => s.trim()).filter(Boolean);
  const { reportLines: cleanupLines, extraTables, dropOrder, cleanupStatements } = await detectCleanup(new Set(tableOrder.map(k => k)), { dbUrl, keepAlways });
  if (cleanupStatements.length) {
    fs.writeFileSync(path.join(dbDir, 'full_setup_cleanup.sql'), cleanupStatements.join('\n\n') + '\n');
  } else {
    fs.writeFileSync(path.join(dbDir, 'full_setup_cleanup.sql'), '-- No extra tables found\n');
  }

  // Reports
  const repairLines = [];
  repairLines.push('# Schema Repair Report');
  repairLines.push('');
  repairLines.push(`Date: ${new Date().toISOString()}`);
  repairLines.push('');
  if (report.columns.length) {
    repairLines.push('## Columns added');
    report.columns.forEach(c => repairLines.push(`- ${c}`));
    repairLines.push('');
  }
  if (report.fks.length) {
    repairLines.push('## Foreign keys ensured');
    report.fks.forEach(c => repairLines.push(`- ${c}`));
    repairLines.push('');
  }
  if (report.views.length) {
    repairLines.push('## Views recreated');
    report.views.forEach(v => repairLines.push(`- ${v}`));
    repairLines.push('');
  }
  if (report.policies.length) {
    repairLines.push('## Policies rewritten');
    report.policies.forEach(p => repairLines.push(`- ${p}`));
    repairLines.push('');
  }
  if (report.functions.length) {
    repairLines.push('## Function aliases');
    report.functions.forEach(f => repairLines.push(`- ${f}`));
    repairLines.push('');
  }
  if (report.triggers && report.triggers.length) {
    repairLines.push('## Triggers ensured');
    report.triggers.forEach(t => repairLines.push(`- ${t}`));
    repairLines.push('');
  }
  fs.writeFileSync(path.join(reportDir, 'SCHEMA_REPAIR.md'), repairLines.join('\n'));

  const cleanupReport = [];
  cleanupReport.push('# Schema Cleanup Report');
  cleanupReport.push('');
  cleanupReport.push(`Date: ${new Date().toISOString()}`);
  cleanupReport.push('');
  cleanupReport.push(`Mode: ${apply ? 'apply' : 'dry-run'}`);
  cleanupReport.push('');
  cleanupReport.push('## Extra tables');
  if (extraTables.length) {
    extraTables.forEach(t => cleanupReport.push(`- ${t}`));
    cleanupReport.push('');
    cleanupReport.push('### Proposed drop order');
    dropOrder.forEach((t, i) => cleanupReport.push(`${i + 1}. ${t}`));
    cleanupReport.push('');
  } else {
    cleanupReport.push('None');
    cleanupReport.push('');
  }
  cleanupLines.forEach(l => cleanupReport.push(l));
  fs.writeFileSync(path.join(reportDir, 'SCHEMA_CLEANUP.md'), cleanupReport.join('\n'));
}

main();
