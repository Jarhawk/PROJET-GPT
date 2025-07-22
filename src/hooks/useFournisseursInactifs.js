// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useFournisseursInactifs() {
  const { mama_id } = useAuth();
  const [fournisseurs, setFournisseurs] = useState([]);

  async function fetchInactifs() {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from('v_fournisseurs_inactifs')
      .select('*')
      .eq('mama_id', mama_id);
    if (error) {
      setFournisseurs([]);
      return [];
    }
    setFournisseurs(Array.isArray(data) ? data : []);
    return data || [];
  }

  return { fournisseurs, fetchInactifs };
}
