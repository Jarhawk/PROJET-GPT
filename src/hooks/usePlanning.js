// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';

export function usePlanning() {
  const { mama_id } = useAuth();

  async function getPlannings({ statut = "", debut = "", fin = "" } = {}) {
    if (!mama_id) return { data: [] };
    let q = supabase
      .from("planning_previsionnel")
      .select("*", { count: "exact" })
      .eq("mama_id", mama_id)
      .eq("actif", true)
      .order("date_prevue", { ascending: true });
    if (statut) q = q.eq("statut", statut);
    if (debut) q = q.gte("date_prevue", debut);
    if (fin) q = q.lte("date_prevue", fin);
    const { data, error } = await q;
    if (error) {
      console.error("getPlannings", error.message);
      return { data: [] };
    }
    return { data: data || [] };
  }

  async function getPlanningById(id) {
    if (!id || !mama_id) return null;
    const { data, error } = await supabase
      .from("planning_previsionnel")
      .select("*, lignes:planning_lignes!planning_id(id, planning_id, produit_id, quantite, observation, produit:produit_id(nom))")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      console.error("getPlanningById", error.message);
      return null;
    }
    return data || null;
  }

  async function createPlanning({ nom, date_prevue, commentaire = "", statut = "prévu", lignes = [] }) {
    if (!mama_id) return { error: new Error("mama_id manquant") };
    const { data, error } = await supabase
      .from("planning_previsionnel")
      .insert([{ nom, date_prevue, commentaire, statut, mama_id }])
      .select("id")
      .single();
    if (error) return { error };
    if (lignes.length) {
      const rows = lignes.map(l => ({
        planning_id: data.id,
        produit_id: l.produit_id,
        quantite: l.quantite,
        observation: l.observation || "",
        mama_id,
      }));
      const { error: err2 } = await supabase.from("planning_lignes").insert(rows);
      if (err2) return { error: err2 };
    }
    return { data };
  }

  async function updatePlanning(id, fields) {
    if (!mama_id) return { error: new Error("mama_id manquant") };
    const { data, error } = await supabase
      .from("planning_previsionnel")
      .update(fields)
      .eq("id", id)
      .eq("mama_id", mama_id)
      .select()
      .single();
    if (error) return { error };
    return { data };
  }

  async function deletePlanning(id) {
    if (!mama_id) return { error: new Error("mama_id manquant") };
    const { error } = await supabase
      .from("planning_previsionnel")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) return { error };
    return { data: true };
  }

  // aliases for backward compatibility
  async function fetchPlanning({ start, end, statut } = {}) {
    if (!mama_id) return [];
    let q = supabase
      .from("planning_previsionnel")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("actif", true)
      .order("date_prevue", { ascending: true });
    if (statut) q = q.eq("statut", statut);
    if (start) q = q.gte("date_prevue", start);
    if (end) q = q.lte("date_prevue", end);
    const { data, error } = await q;
    if (error) {
      console.error("fetchPlanning", error.message);
      return [];
    }
    return data || [];
  }
  const addPlanning = createPlanning;

  return {
    getPlannings,
    getPlanningById,
    createPlanning,
    updatePlanning,
    deletePlanning,
    fetchPlanning,
    addPlanning,
  };
}

export default usePlanning;
