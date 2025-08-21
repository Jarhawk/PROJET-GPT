import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useMultiMama } from "@/context/MultiMamaContext";

export async function searchProductsBasic(mamaId, q) {
  let query = supabase
    .from("produits")
    .select("id, nom, pmp")
    .eq("mama_id", mamaId)
    .eq("actif", true)
    .order("nom", { ascending: true })
    .limit(50);
  if (q?.trim()) {
    query = query.ilike("nom", `%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export default function useProductSearch(q) {
  const { currentMamaId } = useMultiMama();

  return useQuery({
    queryKey: ["product-search", currentMamaId, q],
    enabled: !!currentMamaId,
    queryFn: () => searchProductsBasic(currentMamaId, q),
  });
}
