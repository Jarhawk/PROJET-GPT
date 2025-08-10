#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function readInputFile() {
  const preferred = path.join('db', 'full_setup_fixed.sql');
  const fallback = 'full_setup_fixed.sql';
  if (fs.existsSync(preferred)) return preferred;
  if (fs.existsSync(fallback)) return fallback;
  throw new Error('Input SQL file not found');
}

// Basic tokenizer splitting SQL statements by ; handling quotes and dollar quotes
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

// Split comma-separated parts outside parentheses/quotes
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
  return ident.replace(/\"/g, '').trim();
}

function quoteIdent(ident) {
  if (/^[a-z_][a-z0-9_]*$/.test(ident)) return ident;
  return `"${ident.replace(/\"/g, '""')}"`;
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
      const colType = refCol ? refCol.type : 'uuid';
      columnAdditions.push({
        schema: fk.table.schema,
        table: fk.table.table,
        column: col,
        type: colType
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
  return `DO $$\nBEGIN\n  IF NOT EXISTS (\n    SELECT 1 FROM information_schema.columns\n    WHERE table_schema='${schema}' AND table_name='${table}' AND column_name='${column}'\n  ) THEN\n    ALTER TABLE ${schema}.${table}\n      ADD COLUMN ${column} ${type};\n  END IF;\nEND $$;`;
}

function buildAddFkBlock(fk) {
  const { schema, table } = fk.table;
  const localCols = fk.localCols.join(', ');
  const refTable = `${fk.refSchema}.${fk.refTable}`;
  const refCols = fk.refCols.join(', ');
  const options = fk.options ? ' ' + fk.options : '';
  return `DO $$\nBEGIN\n  IF NOT EXISTS (\n    SELECT 1 FROM pg_constraint c\n    JOIN pg_class cl ON cl.oid = c.conrelid\n    JOIN pg_namespace n ON n.oid = cl.relnamespace\n    WHERE c.contype='f' AND c.conname='${fk.name}'\n      AND n.nspname='${schema}' AND cl.relname='${table}'\n  ) THEN\n    ALTER TABLE ${schema}.${table}\n      ADD CONSTRAINT ${fk.name}\n      FOREIGN KEY (${localCols}) REFERENCES ${refTable}(${refCols})${options};\n  END IF;\nEND $$;`;
}

function main() {
  const inputPath = readInputFile();
  const sql = fs.readFileSync(inputPath, 'utf8');
  const statements = splitSqlStatements(sql);
  const { tables, tableOrder, fks, extensions, others } = parseStatements(statements);

  const columnAdditions = [];
  const fkBlocks = [];
  const report = [];
  const usedFkNames = new Set();

  for (const fk of fks) {
    const reportEntry = {
      local: `${fk.table.schema}.${fk.table.table}(${fk.localCols.join(',')})`,
      ref: `${fk.refSchema}.${fk.refTable}(${fk.refCols ? fk.refCols.join(',') : ''})`,
      status: []
    };
    resolveFkTypes(fk, tables, columnAdditions, reportEntry);
    if (!fk.skip) {
      generateFkName(fk, usedFkNames);
      reportEntry.ref = `${fk.refSchema}.${fk.refTable}(${fk.refCols.join(',')})`;
      if (fk.source === 'inline') {
        if (fk.needsMove) {
          reportEntry.status.push('REORDERED');
          fkBlocks.push(buildAddFkBlock(fk));
        }
      } else {
        fkBlocks.push(buildAddFkBlock(fk));
      }
    }
    report.push(reportEntry);
  }

  const createTableStmts = tableOrder.map(key => buildCreateTableStatement(tables[key]));
  const addColumnBlocks = columnAdditions.map(buildAddColumnBlock);
  const finalStatements = [
    ...extensions,
    ...createTableStmts,
    ...addColumnBlocks,
    ...others,
    ...fkBlocks
  ];
  const outputSql = finalStatements.join('\n\n') + '\n';
  const outputPath = path.join('db', 'full_setup_fixed_fkc.sql');
  fs.writeFileSync(outputPath, outputSql);

  const lines = [];
  lines.push('# FK Audit Report');
  lines.push('');
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Total foreign keys scanned: ${report.length}`);
  lines.push('');
  for (const r of report) {
    const stat = r.status.length ? ' — ' + r.status.join(', ') : '';
    lines.push(`- ${r.local} -> ${r.ref}${stat}`);
  }
  if (!fs.existsSync('REPORTS')) fs.mkdirSync('REPORTS');
  fs.writeFileSync(path.join('REPORTS', 'FK_AUDIT.md'), lines.join('\n'));

  console.log(`Processed ${report.length} foreign keys.`);
  console.log(`Wrote ${outputPath} and REPORTS/FK_AUDIT.md`);
}

main();
