// src/hooks/useRequisitions.js
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useRequisitions = () => {
  const { mama_id } = useAuth();

  const getRequisitions = async () => {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from("requisitions")
      .select("*, requisition_lines(*)")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erreur getRequisitions:", error.message);
      return [];
    }

    return data || [];
  };

  const getRequisitionById = async (id) => {
    if (!id || !mama_id) return null;
    const { data, error } = await supabase
      .from("requisitions")
      .select("*, requisition_lines(*)")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      console.error("❌ Erreur getRequisitionById:", error.message);
      return null;
    }
    return data || null;
  };

  const createRequisition = async ({ zone, type = "", motif = "", lignes = [], status = "en_attente" }) => {
    if (!mama_id) return { success: false, message: "mama_id manquant" };

    try {
      const { data: req, error: reqError } = await supabase
        .from("requisitions")
        .insert([{ zone, type, motif, mama_id, status }])
        .select()
        .single();

      if (reqError || !req?.id) {
        console.error("❌ Erreur création réquisition :", reqError);
        return { success: false, message: "Erreur création réquisition" };
      }

      for (const ligne of lignes) {
        const { error: ligneError } = await supabase
          .from("requisition_lines")
          .insert([{ requisition_id: req.id, ...ligne }]);

        if (ligneError) {
          console.error("❌ Erreur ligne réquisition :", ligneError);
          return { success: false, message: "Erreur ajout ligne" };
        }
      }

      return { success: true, requisition: req };
    } catch (err) {
      console.error("❌ Exception requisition :", err.message);
      return { success: false, message: "Erreur système" };
    }
  };

  return {
    getRequisitions,
    getRequisitionById,
    createRequisition,
    refetch: getRequisitions,
  };
};

export default useRequisitions;
