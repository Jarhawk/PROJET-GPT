import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, 'schema.json'), 'utf8'))

export function getEntity(name) {
  return schema.tables[name] || schema.views[name] || null
}

export function getRpc(name) {
  return schema.rpcs[name] || null
}
