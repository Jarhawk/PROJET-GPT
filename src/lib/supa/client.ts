import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

declare global {
  // eslint-disable-next-line no-var
  var __supabase__: ReturnType<typeof createClient> | undefined;
}

export const supabase =
  globalThis.__supabase__ ??
  (globalThis.__supabase__ = createClient(url, anon, {
    auth: {
      persistSession: true,
      storageKey: 'mamastock.auth', // pick a stable key
    },
  }));

export default supabase;
