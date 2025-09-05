// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Missing Supabase credentials: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function main() {
  const { data, error } = await supabase
    .from('fournisseurs')
    .select('*')
    .limit(5);
  console.log('Test fournisseurs', { data, error });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
