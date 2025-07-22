// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useTransferts() {
  const { mama_id, user_id } = useAuth();
  const [transferts, setTransferts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchTransferts({ debut = "", fin = "" } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("v_transferts_historique")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date_transfert", { ascending: false });
    if (debut) q = q.gte("date_transfert", debut);
    if (fin) q = q.lte("date_transfert", fin);
    const { data, error } = await q;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    setTransferts(Array.isArray(data) ? data : []);
    return data || [];
  }

  async function createTransfert(header, lignes = []) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
    const { data: tr, error } = await supabase
      .from("transferts")
      .insert([{ ...header, mama_id, utilisateur_id: user_id }])
      .select()
      .single();
    if (error) {
      setError(error);
      setLoading(false);
      return { error };
    }
    const withId = lignes.map((l) => ({ ...l, transfert_id: tr.id }));
    const { error: err2 } = await supabase.from("transfert_lignes").insert(withId);
    setLoading(false);
    if (err2) {
      setError(err2);
      return { error: err2 };
    }
    setTransferts((t) => [tr, ...t]);
    return { data: tr };
  }

  return { transferts, loading, error, fetchTransferts, createTransfert };
}

export default useTransferts;
