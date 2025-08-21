import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useMultiMama } from "@/context/MultiMamaContext";

// Hook principal (recommandé)
export default function useFournisseursAutocomplete(q = "") {
  const { currentMamaId } = useMultiMama();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
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
        req = req.ilike("nom", `%${q}%`);
      }

      const { data, error } = await req;
      if (error) throw error;
      return data ?? [];
    },
  });

  console.debug("[fournisseurs]", { q, count: data?.length || 0 });

  return { data: data ?? [], isLoading, error };
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
    req = req.ilike("nom", `%${q}%`);
  }

  const { data, error } = await req;
  if (error) throw error;
  const rows = data ?? [];
  console.debug("[fournisseurs]", { q, count: rows.length });
  return rows;
}

