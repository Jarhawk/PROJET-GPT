import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useMultiMama } from "@/context/MultiMamaContext";

export async function searchProductsBasic(mamaId, q = "") {
  let query = supabase
    .from("produits")
    .select("id, nom, pmp")
    .eq("mama_id", mamaId)
    .eq("actif", true)
    .order("nom", { ascending: true })
    .limit(50);
  if (q && q.trim()) {
    query = query.ilike("nom", `%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  console.debug("[produits]", { q, count: rows.length });
  return rows;
}

export default function useProductSearch(q = "") {
  const { currentMamaId } = useMultiMama();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["product-search", currentMamaId, q],
    enabled: !!currentMamaId,
    queryFn: () => searchProductsBasic(currentMamaId, q),
  });

  console.debug("[produits]", { q, count: data?.length || 0 });

  return { data: data ?? [], isLoading, error };
}
