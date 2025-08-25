import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import { getEntity } from './schemaUtil.js'

const files = fg.sync('src/**/*.{js,jsx,ts,tsx}', { dot: true })
const report = []
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  if (content.includes("from '@supabase/supabase-js'")) {
    report.push(`Direct supabase-js import in ${file}`)
  }
  const fromMatches = [...content.matchAll(/supabase\.from\(['\"]([^'\"]+)['\"]\)/g)]
  for (const match of fromMatches) {
    const table = match[1]
    const entity = getEntity(table)
    const slice = content.slice(match.index, match.index + 200)
    const selectMatch = slice.match(/select\(['\"]([^'\"]*)['\"]\)/)
    if (selectMatch) {
      const cols = selectMatch[1]
        .split(',')
        .map((c) => c.trim().split(':').pop())
        .filter(Boolean)
      if (!entity) {
        report.push(`Unknown table ${table} in ${file}`)
      } else {
        const missing = cols.filter((c) => !entity.columns.includes(c))
        if (missing.length) {
          report.push(`Unknown columns ${missing.join(', ')} on ${table} in ${file}`)
        }
      }
    }
    if (entity && entity.columns.includes('mama_id')) {
      if (!/\.eq\(['\"]mama_id['\"],\s*mamaId\)/.test(slice)) {
        report.push(`Missing mama_id filter for table ${table} in ${file}`)
      }
    }
  }
}

const out = path.join('scripts', 'report.md')
fs.writeFileSync(out, report.map((r) => `- ${r}`).join('\n'))
console.log(`Report written to ${out} with ${report.length} entries`)
