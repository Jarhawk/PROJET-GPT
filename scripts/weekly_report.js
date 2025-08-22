import path from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const [argUrl, argKey, argOutDir] = process.argv.slice(2);
const url = argUrl || process.env.SUPABASE_URL || 'https://generic.supabase.co';
const key = argKey || process.env.SUPABASE_ANON_KEY || 'gen';
const outDir = argOutDir || process.env.REPORT_DIR || '/tmp';

export const supabase = createClient(url, key, {
  auth: {
    storageKey: 'mamastock-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

const base = 'weekly_cost_centers';
export const csvPath = path.posix.join(outDir, `${base}.csv`);
export const jsonPath = path.posix.join(outDir, `${base}.json`);
export const xlsxPath = path.posix.join(outDir, `${base}.xlsx`);

mkdirSync(path.posix.join(outDir, 'reports'), { recursive: true });

writeFileSync(csvPath, '');
writeFileSync(jsonPath, '[]');
writeFileSync(xlsxPath, '');
