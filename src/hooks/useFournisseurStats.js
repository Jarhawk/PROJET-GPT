// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useFournisseurStats.js

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Stats d’évolution d’achats (tous fournisseurs ou par fournisseur)
export function useFournisseurStats() {
  const { mama_id } = useAuth();

  // Stats tous fournisseurs (évolution mensuelle)
  async function fetchStatsAll() {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from('fournisseur_achats_mois')
      .select('fournisseur_id, mois, montant_ht, montant, mama_id')
      .eq('mama_id', mama_id);
    if (error) {
      console.error('fetchStatsAll', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  }

  // Stats pour 1 fournisseur précis (évolution mensuelle)
  async function fetchStatsForFournisseur(fournisseur_id) {
    if (!mama_id || !fournisseur_id) return [];
    const { data, error } = await supabase
      .from('fournisseur_achats_mois')
      .select('fournisseur_id, mois, montant_ht, montant, mama_id')
      .eq('mama_id', mama_id)
      .eq('fournisseur_id', fournisseur_id);
    if (error) {
      console.error('fetchStatsForFournisseur', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  }

  return { fetchStatsAll, fetchStatsForFournisseur };
}
