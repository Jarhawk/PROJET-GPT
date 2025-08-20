import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useMultiMama } from "@/context/MultiMamaContext";

export function useProductSearch(q) {
  const { currentMamaId } = useMultiMama();

  return useQuery({
    queryKey: ["product-search", currentMamaId, q],
    enabled: !!currentMamaId && (q?.trim()?.length ?? 0) > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produits")
        .select("id, nom, pmp")              // ne pas ajouter de colonnes non existantes
        .eq("mama_id", currentMamaId)
        .eq("actif", true)
        .ilike("nom", `%${q}%`)              // ILIKE sur produits.nom UNIQUEMENT
        .order("nom", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

