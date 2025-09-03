import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.resolve(__dirname, '../db/Etat back end.txt')
const outDir = path.resolve(__dirname, '../tmp')
const outPath = path.join(outDir, 'schema.map.json')

const raw = fs.readFileSync(sourcePath, 'utf8')
const lines = raw.split(/\r?\n/)

const tables = {}
const views = {}
const rpcs = {}

// ----------------------
// Parse columns section
// ----------------------
let inColumns = false
for (const line of lines) {
  if (line.startsWith('| table_name') && line.includes('column_name')) {
    inColumns = true
    continue
  }
  if (!inColumns) continue
  if (!line.startsWith('|')) break
  const cells = line.split('|').map((c) => c.trim())
  if (cells.length < 5) continue
  const table = cells[1]
  const column = cells[3]
  const type = cells[4]
  if (
    !table ||
    !column ||
    table === 'table_name' ||
    column === 'column_name' ||
    table.startsWith('-') ||
    column.startsWith('-')
  )
    continue
  const collection = tables // assume table; views handled later via SCHEMA_OBJECTS
  if (!collection[table])
    collection[table] = { columns: {}, foreignKeys: [], rls: { requiresMamaId: false } }
  collection[table].columns[column] = type
  if (column === 'mama_id') collection[table].rls.requiresMamaId = true
}

// ----------------------
// Parse foreign keys
// ----------------------
let inFk = false
for (const line of lines) {
  if (line.startsWith('| fk_name')) {
    inFk = true
    continue
  }
  if (!inFk) continue
  if (!line.startsWith('|')) break
  const cells = line.split('|').map((c) => c.trim())
  if (cells.length < 8) continue
  const fkName = cells[1]
  const srcTable = cells[3]
  const srcColumn = cells[4]
  const tgtTable = cells[6]
  const tgtColumn = cells[7]
  if (
    !fkName ||
    fkName === 'fk_name' ||
    srcTable.startsWith('-') ||
    srcColumn.startsWith('-') ||
    tgtTable.startsWith('-') ||
    tgtColumn.startsWith('-')
  )
    continue
  if (!tables[srcTable])
    tables[srcTable] = { columns: {}, foreignKeys: [], rls: { requiresMamaId: false } }
  tables[srcTable].foreignKeys.push({
    column: srcColumn,
    references: { table: tgtTable, column: tgtColumn },
  })
}

// ----------------------
// Parse RPC section if present
// ----------------------
let inRpc = false
for (const line of lines) {
  if (line.startsWith('| routine_schema') && line.includes('routine_name')) {
    inRpc = true
    continue
  }
  if (!inRpc) continue
  if (!line.startsWith('|')) break
  const cells = line.split('|').map((c) => c.trim())
  if (cells.length < 6) continue
  const routine = cells[2]
  const paramName = cells[3]
  const paramType = cells[5]
  if (!routine || routine === 'routine_name') continue
  if (!rpcs[routine]) rpcs[routine] = { params: [] }
  if (paramName && paramName !== 'parameter_name')
    rpcs[routine].params.push({ name: paramName, type: paramType })
}

// Fallback: ensure rpcs known from front are listed even if not in file
const manualRpcs = {
  move_zone_products: ['p_mama', 'p_src_zone', 'p_dest_zone', 'p_remove_src'],
  copy_zone_products: ['p_mama', 'p_src_zone', 'p_dest_zone', 'p_overwrite'],
  merge_zone_products: ['p_mama', 'p_src_zone', 'p_dest_zone'],
  fn_save_facture: ['mama_id', 'facture', 'lignes'],
}
for (const [name, params] of Object.entries(manualRpcs)) {
  if (!rpcs[name])
    rpcs[name] = { params: params.map((p) => ({ name: p, type: null })) }
}

// ----------------------
// Sort entries for stable output
// ----------------------
function sortEntityMap(map) {
  const sorted = {}
  for (const key of Object.keys(map).sort()) {
    const entity = map[key]
    const cols = Object.keys(entity.columns)
      .sort()
      .reduce((acc, k) => {
        acc[k] = entity.columns[k]
        return acc
      }, {})
    entity.columns = cols
    entity.foreignKeys.sort((a, b) => a.column.localeCompare(b.column))
    sorted[key] = entity
  }
  return sorted
}

const sortedRpcs = Object.keys(rpcs)
  .sort()
  .reduce((acc, name) => {
    acc[name] = {
      params: rpcs[name].params.sort((a, b) => a.name.localeCompare(b.name)),
    }
    return acc
  }, {})

fs.mkdirSync(outDir, { recursive: true })
const out = {
  tables: sortEntityMap(tables),
  views: sortEntityMap(views),
  rpcs: sortedRpcs,
}
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log('schema map written to', outPath)

