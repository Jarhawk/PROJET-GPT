// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useRequisitions.js
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useRequisitions() {
  const { mama_id, user_id } = useAuth();

  async function getRequisitions({ produit = "", zone = "", type = "", debut = "", fin = "" } = {}) {
    if (!mama_id) return [];
    let query = supabase
      .from("requisitions")
      .select("*", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });
    if (produit) query = query.eq("produit_id", produit);
    if (zone) query = query.eq("zone_id", zone);
    if (type) query = query.eq("type", type);
    if (debut) query = query.gte("date", debut);
    if (fin) query = query.lte("date", fin);
    const { data, error } = await query;
    if (error) {
      console.error("❌ Erreur getRequisitions:", error.message);
      return [];
    }
    return data || [];
  }

  async function getRequisitionById(id) {
    if (!id || !mama_id) return null;
    const { data, error } = await supabase
      .from("requisitions")
      .select("*")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      console.error("❌ Erreur getRequisitionById:", error.message);
      return null;
    }
    return data || null;
  }

  async function createRequisition({ produit_id, zone_id, quantite, date = new Date().toISOString().slice(0, 10), type = "", commentaire = "" }) {
    if (!mama_id) return { error: "mama_id manquant" };
    const { data, error } = await supabase
      .from("requisitions")
      .insert([{ produit_id, zone_id, quantite, date, type, commentaire, mama_id, auteur_id: user_id }])
      .select()
      .single();
    if (error) {
      console.error("❌ Erreur creation requisition:", error.message);
      return { error };
    }
    return { data };
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
