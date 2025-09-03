import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const srcDir = path.join(rootDir, 'src')
const tmpDir = path.join(rootDir, 'tmp')
const schemaPath = path.join(tmpDir, 'schema.map.json')

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

// Load schema map
let schema = {}
try {
  const rawSchema = fs.readFileSync(schemaPath, 'utf8')
  schema = JSON.parse(rawSchema)
} catch (e) {
  console.error('Cannot read schema.map.json. Run parseBack.js first.')
  process.exit(1)
}

function getTableInfo(name) {
  return schema.tables?.[name] || schema.views?.[name]
}

// ------------------------
// Pages report
// ------------------------
const pages = await fg('pages/**/*.{jsx,tsx}', { cwd: srcDir })
const pagesOut = path.join(tmpDir, 'pages_report.json')
fs.writeFileSync(pagesOut, JSON.stringify(pages.sort(), null, 2))

// ------------------------
// Supabase query scan
// ------------------------
const srcFiles = await fg('**/*.{js,jsx,ts,tsx}', { cwd: srcDir })
const queries = []

for (const file of srcFiles) {
  const fullPath = path.join(srcDir, file)
  const code = fs.readFileSync(fullPath, 'utf8')
  let ast
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] })
  } catch (e) {
    continue
  }

  traverse.default(ast, {
    CallExpression(path) {
      const node = path.node
      if (
        node.callee?.type === 'MemberExpression' &&
        node.callee.property?.name === 'select'
      ) {
        const fromCall = node.callee.object
        if (
          fromCall?.type === 'CallExpression' &&
          fromCall.callee?.type === 'MemberExpression' &&
          ['from', 'rpc'].includes(fromCall.callee.property?.name)
        ) {
          const method = fromCall.callee.property.name
          const arg = fromCall.arguments[0]
          if (arg?.type !== 'StringLiteral') return
          const resource = arg.value
          const selectArg = node.arguments[0]
          const columns = []
          const missingColumns = []
          const joins = []
          const joinIssues = []

          if (selectArg?.type === 'StringLiteral') {
            const pieces = selectArg.value.split(',')
            for (const raw of pieces) {
              const piece = raw.trim()
              if (!piece) continue
              if (piece.includes('(')) {
                // join
                const beforeParen = piece.split('(')[0]
                const afterAlias = beforeParen.split(':').pop()
                const joinTable = afterAlias.split('!')[0]
                joins.push(joinTable)
                const baseInfo = getTableInfo(resource)
                const joinInfo = getTableInfo(joinTable)
                let hasFK = false
                if (baseInfo?.foreignKeys) {
                  hasFK = baseInfo.foreignKeys.some(
                    fk => fk.references.table === joinTable
                  )
                }
                if (!hasFK && joinInfo?.foreignKeys) {
                  hasFK = joinInfo.foreignKeys.some(
                    fk => fk.references.table === resource
                  )
                }
                if (!hasFK) {
                  joinIssues.push(joinTable)
                }
              } else {
                const col = piece.split(':').pop()
                columns.push(col)
                const info = getTableInfo(resource)
                if (info?.columns && !info.columns[col]) {
                  missingColumns.push(col)
                }
              }
            }
          }

          queries.push({ file, resource, method, columns, missingColumns, joins, joinIssues })
        }
      }
    }
  })
}

const queriesOut = path.join(tmpDir, 'queries_report.json')
fs.writeFileSync(queriesOut, JSON.stringify(queries, null, 2))

console.log(`Pages: ${pages.length}, Queries: ${queries.length}`)
