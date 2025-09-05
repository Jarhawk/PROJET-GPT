// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import 'dotenv/config';
import { supabase } from '@/lib/supa/client';

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
