// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useFournisseurStats.js

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Stats d’évolution d’achats (tous fournisseurs ou par fournisseur)
export function useFournisseurStats() {
  const { mama_id } = useAuth();

  // Stats tous fournisseurs (évolution mensuelle)
  async function fetchStatsAll() {
    if (!mama_id) return [];
    const { data, error } = await supabase.rpc("stats_achats_fournisseurs", { mama_id_param: mama_id });
    if (error) return [];
    return data || [];
  }

  // Stats pour 1 fournisseur précis (évolution mensuelle)
  async function fetchStatsForFournisseur(fournisseur_id) {
    if (!mama_id) return [];
    const { data, error } = await supabase.rpc("stats_achats_fournisseur", {
      mama_id_param: mama_id,
      fournisseur_id_param: fournisseur_id,
    });
    if (error) return [];
    return data || [];
  }

  return { fetchStatsAll, fetchStatsForFournisseur };
}
