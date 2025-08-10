import { writeFile } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (url && key) {
  supabase = createClient(url, key);
}

async function execSql(sql) {
  if (!supabase) throw new Error('Missing Supabase credentials');
  const res = await fetch(`${url}/rest/v1/rpc/sql`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function add(lines, label, ok, err) {
  lines.push(`- ${label}: ${ok ? 'OK' : `KO${err ? ` (${err})` : ''}`}`);
}

async function main() {
  const lines = ['# Schema smoke test', ''];

  const tables = ['requisitions', 'requisition_lignes', 'commandes', 'commande_lignes', 'zones_stock', 'produits', 'periodes_comptables', 'utilisateurs', 'roles'];
  lines.push('## Tables');
  for (const t of tables) {
    try {
      const data = await execSql(`select to_regclass('public.${t}') as reg`);
      const ok = data && data[0] && data[0].reg;
      add(lines, t, !!ok);
    } catch (e) {
      add(lines, t, false, e.message);
    }
  }
  lines.push('');

  lines.push('## Columns');
  try {
    const data = await execSql("select column_default, is_nullable from information_schema.columns where table_schema='public' and table_name='zones_stock' and column_name='position'");
    const row = data[0];
    const ok = row && row.is_nullable === 'NO' && row.column_default && row.column_default.includes('0');
    add(lines, 'zones_stock.position not null default 0', ok);
  } catch (e) {
    add(lines, 'zones_stock.position not null default 0', false, e.message);
  }
  for (const t of tables) {
    try {
      const data = await execSql(`select 1 from information_schema.columns where table_schema='public' and table_name='${t}' and column_name='mama_id'`);
      add(lines, `${t}.mama_id`, data.length > 0);
    } catch (e) {
      add(lines, `${t}.mama_id`, false, e.message);
    }
  }
  lines.push('');

  lines.push('## Functions');
  const functions = ['current_user_mama_id', 'current_user_is_admin_or_manager', 'current_user_is_admin'];
  for (const f of functions) {
    try {
      const data = await execSql(`select routine_name from information_schema.routines where routine_schema='public' and routine_name='${f}'`);
      add(lines, f, data.length > 0);
    } catch (e) {
      add(lines, f, false, e.message);
    }
  }
  lines.push('');

  lines.push('## Policies');
  const policies = ['requisitions_select', 'zones_stock_select'];
  for (const p of policies) {
    try {
      const data = await execSql(`select policyname from pg_policies where policyname='${p}'`);
      add(lines, p, data.length > 0);
    } catch (e) {
      add(lines, p, false, e.message);
    }
  }
  lines.push('');

  lines.push('## Views');
  const views = ['v_products_last_price', 'v_fournisseurs_inactifs', 'v_taches_assignees', 'v_costing_carte', 'v_menu_groupe_resume', 'v_stocks'];
  for (const v of views) {
    try {
      await execSql(`EXPLAIN SELECT * FROM ${v} LIMIT 0`);
      add(lines, v, true);
    } catch (e) {
      add(lines, v, false, e.message);
    }
  }
  lines.push('');

  await writeFile('REPORTS/SCHEMA_SMOKE.md', lines.join('\n'));
}

main();
