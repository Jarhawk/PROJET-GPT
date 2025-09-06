import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { getConfig, defaultDataDir } from './config';

let db: Database | null = null;

function applyMigrations(db: Database) {
  const migrationsDir = path.join(process.cwd(), 'public', 'migrations');
  if (!fs.existsSync(migrationsDir)) return;
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    db.exec(sql);
  }
}

export function getDb(): any {
  if (!db) {
    const { dataDir } = getConfig();
    const dir = dataDir || defaultDataDir;
    fs.mkdirSync(dir, { recursive: true });
    const dbPath = path.join(dir, 'mamastock.db');
    const first = !fs.existsSync(dbPath);
    db = new Database(dbPath);
    if (first) applyMigrations(db);
  }
  return db;
}

export async function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export async function produits_list({ mama_id, limit = 100, offset = 0, search = '', filters = {} } : any = {}) {
  const db = getDb();
  const params: any[] = [mama_id];
  let sql = `SELECT id, nom, mama_id, actif, famille_id, unite_id, code, image, pmp, stock_reel, stock_min, stock_theorique, created_at, updated_at FROM produits WHERE mama_id = $1`;
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND nom ILIKE $${params.length}`;
  }
  for (const [key, value] of Object.entries(filters)) {
    params.push(value);
    sql += ` AND ${key} = $${params.length}`;
  }
  params.push(limit, offset);
  sql += ` ORDER BY nom ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;
  try {
    const res = await db.query(sql, params);
    return { data: res.rows, count: res.rowCount, error: null };
  } catch (error) {
    return { data: [], count: 0, error };
  }
}

export async function produits_create(produit: any) {
  const db = getDb();
  const keys = Object.keys(produit);
  const cols = keys.join(',');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
  const values = keys.map(k => (produit as any)[k]);
  try {
    const res = await db.query(`INSERT INTO produits (${cols}) VALUES (${placeholders}) RETURNING *`, values);
    return { data: res.rows[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function produits_update(id: string, fields: any) {
  const db = getDb();
  const keys = Object.keys(fields);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(',');
  const values = [id, ...keys.map(k => (fields as any)[k])];
  try {
    const res = await db.query(`UPDATE produits SET ${sets} WHERE id = $1 RETURNING *`, values);
    return { data: res.rows[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function produits_get(id: string) {
  const db = getDb();
  try {
    const res = await db.query(`SELECT id, nom, mama_id, actif, famille_id, unite_id, code, image, pmp, stock_reel, stock_min, stock_theorique, created_at, updated_at FROM produits WHERE id = $1`, [id]);
    return { data: res.rows[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function produits_prices(produit_id: string) {
  const db = getDb();
  try {
    const res = await db.query(`SELECT produit_id, dernier_prix, fournisseur_id, created_at FROM v_produits_dernier_prix WHERE produit_id = $1 ORDER BY created_at DESC`, [produit_id]);
    return { data: res.rows, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function fournisseurs_list({ mama_id } : any = {}) {
  const db = getDb();
  try {
    const res = await db.query(`SELECT f.*, c.nom as contact, c.email, c.tel FROM fournisseurs f LEFT JOIN fournisseur_contacts c ON f.id = c.fournisseur_id AND f.mama_id = c.mama_id WHERE f.mama_id = $1 ORDER BY f.nom`, [mama_id]);
    return { data: res.rows, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function fournisseurs_create(fournisseur: any) {
  const db = getDb();
  const { contact, email, tel, ...rest } = fournisseur;
  const keys = Object.keys(rest);
  const cols = keys.join(',');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
  const values = keys.map(k => (rest as any)[k]);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(`INSERT INTO fournisseurs (${cols}) VALUES (${placeholders}) RETURNING *`, values);
    const inserted = res.rows[0];
    if (inserted && (contact || email || tel)) {
      await client.query(`INSERT INTO fournisseur_contacts (fournisseur_id, mama_id, nom, email, tel) VALUES ($1, $2, $3, $4, $5)`, [inserted.id, inserted.mama_id, contact || null, email || null, tel || null]);
    }
    await client.query('COMMIT');
    return { data: inserted, error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    return { data: null, error };
  } finally {
    client.release();
  }
}

export async function fournisseurs_update(id: string, mama_id: string, fields: any) {
  const db = getDb();
  const { contact, email, tel, ...rest } = fields;
  const keys = Object.keys(rest);
  const sets = keys.map((k, i) => `${k} = $${i + 3}`).join(',');
  const values = [id, mama_id, ...keys.map(k => (rest as any)[k])];
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let sql = `UPDATE fournisseurs SET ${sets} WHERE id = $1 AND mama_id = $2`;
    if (keys.length === 0) sql = 'SELECT 1';
    await client.query(sql, values);
    if (contact || email || tel) {
      await client.query(`INSERT INTO fournisseur_contacts (fournisseur_id, mama_id, nom, email, tel)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (fournisseur_id, mama_id) DO UPDATE SET nom = EXCLUDED.nom, email = EXCLUDED.email, tel = EXCLUDED.tel`,
        [id, mama_id, contact || null, email || null, tel || null]);
    }
    await client.query('COMMIT');
    return { error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    return { error };
  } finally {
    client.release();
  }
}

export async function facture_create_with_lignes(facture: any, lignes: any[]) {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const fKeys = Object.keys(facture);
    const fCols = fKeys.join(',');
    const fPlaceholders = fKeys.map((_, i) => `$${i + 1}`).join(',');
    const fValues = fKeys.map(k => (facture as any)[k]);
    const fRes = await client.query(`INSERT INTO factures (${fCols}) VALUES (${fPlaceholders}) RETURNING *`, fValues);
    const fact = fRes.rows[0];
    const updatedProducts: any[] = [];
    for (const l of lignes) {
      const lKeys = Object.keys(l);
      const lCols = lKeys.concat('facture_id').join(',');
      const lVals = lKeys.map(k => (l as any)[k]).concat([fact.id]);
      const lPlace = lKeys.concat(['facture_id']).map((_, i) => `$${i + 1}`).join(',');
      await client.query(`INSERT INTO facture_lignes (${lCols}) VALUES (${lPlace})`, lVals);
      if (l.produit_id && l.quantite != null && l.pu_ht != null) {
        const { rows } = await client.query('SELECT stock_reel, pmp FROM produits WHERE id = $1', [l.produit_id]);
        if (rows.length) {
          const stock = Number(rows[0].stock_reel) || 0;
          const pmp = Number(rows[0].pmp) || 0;
          const q = Number(l.quantite) || 0;
          const pu = Number(l.pu_ht) || 0;
          const newStock = stock + q;
          const newPmp = newStock === 0 ? pmp : ((pmp * stock) + (pu * q)) / newStock;
          const upRes = await client.query('UPDATE produits SET stock_reel = $1, pmp = $2 WHERE id = $3 RETURNING id, stock_reel, pmp', [newStock, newPmp, l.produit_id]);
          updatedProducts.push(upRes.rows[0]);
        }
      }
    }
    await client.query('COMMIT');
    return { data: { facture: fact, produits: updatedProducts }, error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    return { data: null, error };
  } finally {
    client.release();
  }
}

