import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaFile = path.resolve(__dirname, '../db/Etat back end.txt')

const raw = fs.readFileSync(schemaFile, 'utf8')
const lines = raw.split(/\r?\n/)

// The resulting structure maps each table/view name to an object
// `{ columns: string[], foreignKeys: Array<{ name: string, column: string, references: { table: string, column: string } }> }`
// RPCs are stored under `rpcs` with their parameter names.
const tables = {}
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
  if (
    !table ||
    !column ||
    table === 'table_name' ||
    column === 'column_name' ||
    table.startsWith('-') ||
    column.startsWith('-')
  )
    continue
  if (!tables[table]) tables[table] = { columns: [], foreignKeys: [] }
  if (!tables[table].columns.includes(column)) tables[table].columns.push(column)
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
  if (!tables[srcTable]) tables[srcTable] = { columns: [], foreignKeys: [] }
  const existing = tables[srcTable].foreignKeys.find((fk) => fk.name === fkName)
  if (!existing) {
    tables[srcTable].foreignKeys.push({
      name: fkName,
      column: srcColumn,
      references: { table: tgtTable, column: tgtColumn },
    })
  }
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
  if (cells.length < 4) continue
  const routine = cells[2]
  const param = cells[3]
  if (!routine || routine === 'routine_name') continue
  if (!rpcs[routine]) rpcs[routine] = { params: [] }
  if (param && param !== 'parameter_name') rpcs[routine].params.push(param)
}

// If the txt file didn't expose RPC definitions, fallback to SCHEMA_OBJECTS.json
if (Object.keys(rpcs).length === 0) {
  try {
    const objectsPath = path.resolve(__dirname, '../SCHEMA_OBJECTS.json')
    const objs = JSON.parse(fs.readFileSync(objectsPath, 'utf8'))
    for (const obj of objs) {
      if (obj.type === 'function' && obj.name && !rpcs[obj.name]) {
        rpcs[obj.name] = { params: [] }
      }
    }
  } catch {
    // ignore if file missing or invalid
  }
}

// Manually add RPCs absent from the txt description but used by the front
const manualRpcs = {
  move_zone_products: ['p_mama', 'p_src_zone', 'p_dest_zone', 'p_remove_src'],
  copy_zone_products: ['p_mama', 'p_src_zone', 'p_dest_zone', 'p_overwrite'],
  merge_zone_products: ['p_mama', 'p_src_zone', 'p_dest_zone']
}
for (const [name, params] of Object.entries(manualRpcs)) {
  if (!rpcs[name]) rpcs[name] = { params }
}

const out = { tables, rpcs }
const outPath = path.resolve(__dirname, 'schema.json')
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log('schema written to', outPath)
