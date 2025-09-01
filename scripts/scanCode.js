import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import { getEntity, getRpc } from './schemaUtil.js'

const jsFiles = fg.sync('src/**/*.{js,jsx,ts,tsx}', { dot: true })
const cssFiles = fg.sync('src/**/*.{css}', { dot: true })
const issues = []

function record(file, line, message) {
  issues.push(`- ${file}:${line} - ${message}`)
}

for (const file of jsFiles) {
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

    if (line.includes("from '@supabase/supabase-js'") && file !== 'src/lib/supabase.js') {
      record(file, lineNo, 'Direct supabase-js import; use src/lib/supabase.js')
    }
    const supabaseImport = line.match(/import\s+\{?[^}]*supabase[^}]*\}?\s+from\s+['"]([^'"\n]+)['"]/)
    if (supabaseImport) {
      const importPath = supabaseImport[1]
      if (!importPath.includes('lib/supabase')) {
        record(file, lineNo, `Supabase client imported from ${importPath} instead of src/lib/supabase.js`)
      }
    }

    const fromMatch = line.match(/supabase\.from\(['"]([^'\"]+)['"]\)/)
    if (fromMatch) {
      const table = fromMatch[1]
      const entity = getEntity(table)
      if (!entity) {
        record(file, lineNo, `Unknown table ${table}`)
      } else {
        // look ahead for next lines (select/insert/update)
        const lookahead = lines.slice(idx, idx + 10).join(' ')
        const selectMatch = lookahead.match(/select\(['"]([^'\"]*)['"]\)/)
        if (selectMatch) {
          const selectStr = selectMatch[1]
          const cols = selectStr
            .split(',')
            .map((c) => c.trim().split(':').pop())
            .filter(Boolean)
          const missing = cols.filter((c) => !entity.columns.includes(c))
          if (missing.length) {
            record(file, lineNo, `Unknown columns on ${table}: ${missing.join(', ')}`)
          }
          const joinMatches = selectStr.matchAll(/([a-zA-Z0-9_]+)!([a-zA-Z0-9_]+)/g)
          for (const jm of joinMatches) {
            const joinTable = jm[1]
            const fkName = jm[2]
            const joinEntity = getEntity(joinTable)
            let fkValid = false
            if (joinEntity) {
              fkValid = joinEntity.foreignKeys.some(
                (fk) =>
                  fk.references.table === table &&
                  (fk.name === fkName || fk.column === fkName || fkName.includes(fk.column))
              )
            }
            if (!fkValid) {
              record(file, lineNo, `Invalid join ${joinTable}!${fkName} for base ${table}`)
            }
          }
        }
        const mutating =
          /\.insert\(/.test(lookahead) ||
          /\.update\(/.test(lookahead) ||
          /\.upsert\(/.test(lookahead) ||
          /\.delete\(/.test(lookahead)
        if (entity.columns.includes('mama_id') && !mutating) {
          const eqMatch = lookahead.match(
            /\.eq\(['"]mama_id['"],\s*[^\)]+\)/
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
      if (!rpc) {
        record(file, lineNo, `Unknown RPC ${fn}`)
      } else if (rpc.params && rpc.params.length) {
        const lookahead = lines.slice(idx, idx + 10).join(' ')
        const callMatch = lookahead.match(
          /supabase\.rpc\(['"][^'"]+['"](,\s*([^\)]*))?\)/
        )
        const paramsSource = callMatch && callMatch[2] ? callMatch[2].trim() : null
        if (!paramsSource) {
          record(file, lineNo, `RPC ${fn} missing payload`)
        } else if (paramsSource.startsWith('{')) {
          const provided = Array.from(
            paramsSource.matchAll(/([a-zA-Z0-9_]+)\s*:/g)
          ).map((m) => m[1])
          const missing = rpc.params.filter((p) => !provided.includes(p))
          const extra = provided.filter((p) => !rpc.params.includes(p))
          if (missing.length) {
            record(file, lineNo, `RPC ${fn} missing params: ${missing.join(', ')}`)
          }
          if (extra.length) {
            record(file, lineNo, `RPC ${fn} unexpected params: ${extra.join(', ')}`)
          }
        } else {
          record(
            file,
            lineNo,
            `RPC ${fn} payload not object literal; validation skipped`
          )
        }
      }
    }

    if (/[^?.]\.(map|find)\(/.test(line)) {
      record(file, lineNo, 'Possible array method without safety check')
    }
  })
}

// Basic CSS validation for unmatched braces and invalid properties
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8')
  const open = (content.match(/\{/g) || []).length
  const close = (content.match(/\}/g) || []).length
  if (open !== close) {
    record(file, 0, 'Unmatched CSS braces')
  }
  if (/\bnull\s*:/.test(content)) {
    record(file, 0, 'CSS contains invalid property "null"')
  }
}

const out = path.join('scripts', 'report.md')
const lines = ['# Scan report', '']
if (issues.length) {
  lines.push(...issues)
} else {
  lines.push('Aucune anomalie détectée.')
}
fs.writeFileSync(out, lines.join('\n') + '\n')
console.log(`Report written to ${out} with ${issues.length} entries`)

