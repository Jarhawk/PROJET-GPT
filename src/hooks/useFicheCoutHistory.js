import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useFicheCoutHistory(ficheId, mamaId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fiche_cout_history")
      .select("*")
      .eq("fiche_id", ficheId)
      .eq("mama_id", mamaId)
      .order("date_cout", { ascending: true });
    setHistory(data || []);
    setLoading(false);
    return !error;
  };

  // Pour enregistrement auto lors de modif
  const addHistory = async ({ cout_total, cout_portion, updated_by }) => {
    const { error } = await supabase
      .from("fiche_cout_history")
      .insert([{ fiche_id: ficheId, mama_id: mamaId, cout_total, cout_portion, updated_by }]);
    return !error;
  };

  return { history, loading, fetchHistory, addHistory };
}
