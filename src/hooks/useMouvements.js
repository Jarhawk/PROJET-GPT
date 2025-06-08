import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useMouvements = () => {
  const { mama_id } = useAuth();

  const getMouvements = async () => {
    if (!mama_id) {
      console.warn("🔍 getMouvements annulé : mama_id non défini");
      return [];
    }

    const { data, error } = await supabase
      .from("movements")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });

    if (error) {
      console.error("❌ Erreur chargement mouvements :", error);
      return [];
    }

    return data || [];
  };

  const createMouvement = async (mouvement) => {
    if (!mama_id) {
      console.error("⛔ Impossible de créer un mouvement sans mama_id");
      throw new Error("Aucun établissement sélectionné");
    }

    const payload = {
      ...mouvement,
      date: mouvement.date || new Date().toISOString(),
      mama_id,
    };

    const { error } = await supabase.from("movements").insert([payload]);

    if (error) {
      console.error("❌ Erreur création mouvement :", error);
      throw error;
    }

    // Successfully created
  };

  return { getMouvements, createMouvement };
};

export default useMouvements;
