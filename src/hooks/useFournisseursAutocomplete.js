import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useMultiMama } from "@/context/MultiMamaContext";

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
        req = req.ilike("nom", `%${q}%`);
      }
      const { data, error } = await req;
      if (error) throw error;
      return data ?? [];
    },
  });
}

