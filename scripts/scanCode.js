import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import { getEntity, getRpc } from './schemaUtil.js'

const files = fg.sync('src/**/*.{js,jsx,ts,tsx}', { dot: true })
const issues = []

function record(file, line, message) {
  issues.push(`- ${file}:${line} - ${message}`)
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  const lines = content.split(/\r?\n/)

  // Basic accessibility check: DialogContent should have a description
  if (
    content.includes('DialogContent') &&
    !content.includes('DialogDescription') &&
    !content.includes('aria-describedby')
  ) {
    const idx = content.indexOf('DialogContent')
    const lineNo = content.slice(0, idx).split(/\r?\n/).length
    record(file, lineNo, 'DialogContent missing description')
  }

  lines.forEach((line, idx) => {
    const lineNo = idx + 1

    if (
      line.includes("from '@supabase/supabase-js'") &&
      file !== 'src/lib/supabase.js'
    ) {
      record(file, lineNo, 'Direct supabase-js import; use src/lib/supabase.js')
    }

    const fromMatch = line.match(/supabase\.from\(['"]([^'\"]+)['"]\)/)
    if (fromMatch) {
      const table = fromMatch[1]
      const entity = getEntity(table)
      if (!entity) {
        record(file, lineNo, `Unknown table ${table}`)
      } else {
        // look ahead for next lines (select/insert/update)
        const lookahead = lines.slice(idx, idx + 3).join(' ')
        const selectMatch = lookahead.match(/select\(['"]([^'\"]*)['"]\)/)
        if (selectMatch) {
          const cols = selectMatch[1]
            .split(',')
            .map((c) => c.trim().split(':').pop())
            .filter(Boolean)
          const missing = cols.filter((c) => !entity.columns.includes(c))
          if (missing.length) {
            record(file, lineNo, `Unknown columns on ${table}: ${missing.join(', ')}`)
          }
        }
        const mutating =
          /\.insert\(/.test(lookahead) ||
          /\.update\(/.test(lookahead) ||
          /\.upsert\(/.test(lookahead) ||
          /\.delete\(/.test(lookahead)
        if (entity.columns.includes('mama_id') && !mutating) {
          const eqMatch = lookahead.match(
            /\.eq\(['"]mama_id['"],\s*(mamaId|mama_id)\)/
          )
          if (!eqMatch) {
            record(file, lineNo, `Missing mama_id filter for ${table}`)
          }
        }
        if (mutating) {
          // no additional checks yet but leave placeholder
        }
      }
    }

    const rpcMatch = line.match(/supabase\.rpc\(['"]([^'\"]+)['"]/)
    if (rpcMatch) {
      const fn = rpcMatch[1]
      const rpc = getRpc(fn)
      if (!rpc) record(file, lineNo, `Unknown RPC ${fn}`)
    }
  })
}

const out = path.join('scripts', 'report.md')
fs.writeFileSync(out, ['# Scan report', '', ...issues].join('\n'))
console.log(`Report written to ${out} with ${issues.length} entries`)

