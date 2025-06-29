// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

export async function backupDb(output = null) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const mama_id = process.env.MAMA_ID || null;
  const tables = [
    'produits',
    'fournisseurs',
    'factures',
    'facture_lignes',
    'inventaires',
    'inventaire_lignes',
    'fournisseur_produits',
    'taches',
    'tache_instances',
    'mouvements_stock'
  ];
  const result = {};
  for (const table of tables) {
    let query = supabase.from(table).select('*');
    if (mama_id) query = query.eq('mama_id', mama_id);
    const { data, error } = await query;
    if (error) throw error;
    result[table] = data;
  }
  const stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const file = output || `backup_${stamp}.json`;
  writeFileSync(file, JSON.stringify(result, null, 2));
  console.log(`Backup saved to ${file}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  backupDb(process.argv[2]).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
