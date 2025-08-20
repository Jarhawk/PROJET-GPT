import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useMultiMama } from "@/context/MultiMamaContext";

// Hook principal (recommandé)
export function useFournisseursAutocomplete(q) {
  const { currentMamaId } = useMultiMama();

  return useQuery({
    queryKey: ["fournisseurs-autocomplete", currentMamaId, q],
    enabled: !!currentMamaId,
    queryFn: async () => {
      let req = supabase
        .from("fournisseurs")
        .select("id, nom")
        .eq("mama_id", currentMamaId)
        .eq("actif", true)
        .order("nom", { ascending: true })
        .limit(50);

      if (q && q.trim().length > 0) {
        req = req.ilike("nom", `%${q}%`); // ILIKE sur fournisseurs.nom
      }

      const { data, error } = await req;
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Fonction de compatibilité (au cas où des écrans appellent encore une “fonction”)
export async function searchFournisseurs(mamaId, q = "") {
  if (!mamaId) return [];
  let req = supabase
    .from("fournisseurs")
    .select("id, nom")
    .eq("mama_id", mamaId)
    .eq("actif", true)
    .order("nom", { ascending: true })
    .limit(50);

  if (q && q.trim().length > 0) {
    req = req.ilike("nom", `%${q}%`); // ILIKE sur fournisseurs.nom uniquement
  }

  const { data, error } = await req;
  if (error) throw error;
  return data ?? [];
}

// default export pour couvrir les imports par défaut existants
export default useFournisseursAutocomplete;
