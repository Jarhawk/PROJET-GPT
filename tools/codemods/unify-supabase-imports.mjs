import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'
import parser from '@babel/parser'
import traversePkg from '@babel/traverse'
import generatePkg from '@babel/generator'
import * as t from '@babel/types'
import { spawnSync } from 'child_process'

const ROOT = path.resolve(process.cwd())
const SRC = path.join(ROOT, 'src')
const DRY = !process.argv.includes('--apply')

const traverse = traversePkg.default
const generate = generatePkg.default

const files = await fg(['**/*.{js,jsx,ts,tsx}'], {
  cwd: SRC,
  ignore: [
    'lib/supabase.*',
    'api/**',
    'functions/**',
    'supabase/**',
    'db/**',
    'scripts/**',
    'node_modules/**',
    'dist/**',
    '.vite/**',
    'tests/**',
    '__tests__/**',
    '__mocks__/**',
  ],
})

const summary = {
  files: [],
  namedToDefault: 0,
  pathToAlias: 0,
  removedCreateClient: 0,
  renamed: 0,
}

for (const rel of files) {
  const filePath = path.join(SRC, rel)
  const code = await fs.readFile(filePath, 'utf8')
  let ast
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })
  } catch (err) {
    console.warn('Skipping', rel, err.message)
    continue
  }

  let changed = false
  let createClientLocal = null
  const createClientDecls = []

  traverse(ast, {
    ImportDeclaration(p) {
      const source = p.node.source.value
      if (source === '@supabase/supabase-js') {
        for (const spec of p.node.specifiers) {
          if (t.isImportSpecifier(spec) && spec.imported.name === 'createClient') {
            createClientLocal = spec.local.name
            summary.removedCreateClient++
          }
        }
        p.remove()
        changed = true
        return
      }
      const isSupabaseLib =
        source.startsWith('@/lib/supabase') ||
        source.includes('lib/supabase') ||
        /supabase(client)?$/i.test(source) ||
        source.endsWith('supabase.js') ||
        source.endsWith('supabase.ts')
      if (!isSupabaseLib) return

      const specs = p.node.specifiers
      if (
        source === '@/lib/supabase' &&
        specs.length === 1 &&
        t.isImportDefaultSpecifier(specs[0]) &&
        specs[0].local.name === 'supabase'
      ) {
        // already good
        return
      }
      if (!source.startsWith('@/lib/supabase')) {
        summary.pathToAlias++
      }
      for (const spec of specs) {
        if (t.isImportSpecifier(spec)) {
          if (spec.local.name !== 'supabase') {
            p.scope.rename(spec.local.name, 'supabase')
            summary.renamed++
          }
          summary.namedToDefault++
        } else if (t.isImportDefaultSpecifier(spec)) {
          if (spec.local.name !== 'supabase') {
            p.scope.rename(spec.local.name, 'supabase')
            summary.renamed++
          }
        }
      }
      p.remove()
      changed = true
    },
    VariableDeclarator(p) {
      if (
        createClientLocal &&
        t.isCallExpression(p.node.init) &&
        t.isIdentifier(p.node.init.callee, { name: createClientLocal })
      ) {
        const name = t.isIdentifier(p.node.id) ? p.node.id.name : null
        if (name) {
          if (name !== 'supabase') {
            p.scope.rename(name, 'supabase')
            summary.renamed++
          }
          createClientDecls.push(p.parentPath)
          changed = true
        }
      }
    },
  })

  if (createClientDecls.length) {
    createClientDecls.forEach((d) => d.remove())
  }

  if (changed) {
    const importAst = parser.parse("import supabase from '@/lib/supabase'", {
      sourceType: 'module',
    })
    ast.program.body.unshift(importAst.program.body[0])
    summary.files.push(rel)
    const output = generate(ast, { retainLines: true }, code).code
    if (output !== code) {
      if (DRY) {
        const diff = spawnSync('diff', ['-u', filePath, '-'], {
          input: output,
          encoding: 'utf8',
        }).stdout
        console.log(`--- ${rel}`)
        console.log(diff)
      } else {
        await fs.writeFile(filePath, output)
      }
    }
  }
}

if (DRY) {
  console.log('\nFiles to update:', summary.files.length)
  summary.files.forEach((f) => console.log(' -', f))
  console.log('\nSummary:', summary)
  console.log('\nRun again with --apply to write changes')
} else {
  console.log('Updated files:', summary.files.length)
}
