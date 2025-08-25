import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaFile = path.resolve(__dirname, '../db/Etat back end.txt')

const raw = fs.readFileSync(schemaFile, 'utf8')
const rawLines = raw.split(/\r?\n/)
const lines = []
for (const line of rawLines) {
  if (line.startsWith('|')) lines.push(line)
  else if (lines.length) lines[lines.length - 1] += ' ' + line.trim()
}

const tables = {}
for (const line of lines) {
  const cells = line
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean)
  if (cells.length < 3) continue
  const [table, position, column] = cells
  if (
    table === 'table_name' ||
    column === 'column_name' ||
    table.startsWith('-') ||
    table === ''
  )
    continue
  if (!tables[table]) tables[table] = { columns: [] }
  if (!tables[table].columns.includes(column)) tables[table].columns.push(column)
}

const outPath = path.resolve(__dirname, 'schema.json')
fs.writeFileSync(outPath, JSON.stringify(tables, null, 2))
console.log('schema written to', outPath)
