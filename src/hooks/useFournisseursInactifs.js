// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useFournisseursInactifs() {
  const { mama_id } = useAuth();
  const [fournisseurs, setFournisseurs] = useState([]);

  async function fetchInactifs() {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from('v_fournisseurs_inactifs')
      .select(
        'id:fournisseur_id, nom, fournisseur_actif, facture_actif, dernier_achat, mama_id'
      )
      .eq('mama_id', mama_id);
    if (error) {
      setFournisseurs([]);
      return [];
    }
    const list = Array.isArray(data) ? data : [];
    setFournisseurs(list);
    return list;
  }

  return { fournisseurs, fetchInactifs };
}
