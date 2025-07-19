// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useRequisitions.js
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useRequisitions() {
  const { mama_id } = useAuth();

  async function getRequisitions({ zone = "", statut = "", debut = "", fin = "", page = 1, limit = 10 } = {}) {
    if (!mama_id) return { data: [], count: 0 };
    let query = supabase
      .from("requisitions")
      .select("*", { count: "exact" })
      .eq("mama_id", mama_id)
      .eq("actif", true)
      .order("date", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (zone) query = query.eq("zone_destination_id", zone);
    if (statut) query = query.eq("statut", statut);
    if (debut) query = query.gte("date", debut);
    if (fin) query = query.lte("date", fin);
    const { data, count, error } = await query;
    if (error) {
      console.error("❌ Erreur getRequisitions:", error.message);
      return { data: [], count: 0 };
    }
    return { data: data || [], count: count || 0 };
  }

  async function getRequisitionById(id) {
    if (!id || !mama_id) return null;
    const { data, error } = await supabase
      .from("requisitions")
      .select("*, lignes:requisition_lignes(*)")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      console.error("❌ Erreur getRequisitionById:", error.message);
      return null;
    }
    return data || null;
  }

  async function createRequisition({ numero = null, date = new Date().toISOString().slice(0,10), zone_source_id = null, zone_destination_id = null, commentaire = "", statut = "", lignes = [] }) {
    if (!mama_id) return { error: "mama_id manquant" };
    const { data, error } = await supabase
      .from("requisitions")
      .insert([{ numero, date, zone_source_id, zone_destination_id, commentaire, statut, mama_id }])
      .select()
      .single();
    if (error) {
      console.error("❌ Erreur creation requisition:", error.message);
      return { error };
    }
    const requisition = data;
    if (lignes.length) {
      const toInsert = lignes.map(l => ({
        requisition_id: requisition.id,
        produit_id: l.produit_id,
        quantite: Number(l.quantite),
        commentaire: l.commentaire || "",
        mama_id,
      }));
      const { error: lineErr } = await supabase.from("requisition_lignes").insert(toInsert);
      if (lineErr) console.error("❌ Erreur lignes requisition:", lineErr.message);
    }
    return { data: requisition };
  }

  async function updateRequisition(id, fields) {
    if (!mama_id) return { error: "mama_id manquant" };
    const { data, error } = await supabase
      .from("requisitions")
      .update(fields)
      .eq("id", id)
      .eq("mama_id", mama_id)
      .select()
      .single();
    if (error) {
      console.error("❌ Erreur update requisition:", error.message);
      return { error };
    }
    return { data };
  }

  async function deleteRequisition(id) {
    if (!mama_id) return { error: "mama_id manquant" };
    const { error } = await supabase
      .from("requisitions")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) {
      console.error("❌ Erreur delete requisition:", error.message);
      return { error };
    }
    return { data: true };
  }

  return {
    getRequisitions,
    getRequisitionById,
    createRequisition,
    updateRequisition,
    deleteRequisition,
    refetch: getRequisitions,
  };
}

export default useRequisitions;
