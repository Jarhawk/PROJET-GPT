// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './supabaseEnv.js';

const cache = new Map();

export function getSupabaseClient(url = null, key = null) {
  let envUrl, envKey;
  try {
    ({ supabaseUrl: envUrl, supabaseKey: envKey } = getSupabaseEnv());
  } catch {
    envUrl = undefined;
    envKey = undefined;
  }
  const supabaseUrl = url || envUrl;
  const supabaseKey = key || envKey;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  const cacheKey = `${supabaseUrl}:${supabaseKey}`;
  if (!cache.has(cacheKey)) {
    cache.set(cacheKey, createClient(supabaseUrl, supabaseKey));
  }
  return cache.get(cacheKey);
}
