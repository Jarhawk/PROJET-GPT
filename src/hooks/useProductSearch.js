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
        .select(
          "id, nom, pmp, tva, unite_id, unite:unite_id(nom)"
        )
        .eq("mama_id", currentMamaId)
        .eq("actif", true)
        .ilike("nom", `%${q}%`)
        .order("nom", { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        nom: p.nom,
        pmp: p.pmp,
        tva: p.tva,
        unite: p.unite?.nom || "",
      }));
    },
  });
}

