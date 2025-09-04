﻿/* @ts-nocheck */
// Stub API promotions — remplace un binaire par du texte
import supabase from '@/lib/supabase';

/**
 * Liste les promotions pour un tenant.
 * @param {string} mamaId
 * @returns {Promise<{data: any[], error: any}>}
 */
export async function listPromotions(mamaId) {
  if (!mamaId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('promotions') // TODO: adapter si la table diffère
    .select('*')
    .eq('mama_id', mamaId)
    .order('created_at', { ascending: false });
  return { data: data ?? [], error: error ?? null };
}

const api = { listPromotions };
export default api;
