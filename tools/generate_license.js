/* eslint-env node */
/* global process */
// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const dbPath = path.resolve('db/license-keys.json');
const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : { licenses: [] };

function save() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function add(client, email, expires) {
  const id = crypto.randomUUID();
  const data = `${client}|${email}|${expires}|${id}`;
  const key = crypto.createHash('sha256').update(data).digest('hex');
  db.licenses.push({ id, client, email, expires, key, revoked: false });
  save();
  console.log('Licence générée :', key);
}

function revoke(key) {
  const lic = db.licenses.find((l) => l.key === key);
  if (!lic) return console.log('Clé non trouvée');
  lic.revoked = true;
  save();
  console.log('Licence révoquée');
}

const [cmd, arg1, arg2, arg3] = process.argv.slice(2);
if (cmd === 'add') add(arg1, arg2, arg3);
else if (cmd === 'revoke') revoke(arg1);
else console.log('Usage:\n  node generate_license.js add <client> <email> <YYYY-MM-DD>\n  node generate_license.js revoke <key>');
