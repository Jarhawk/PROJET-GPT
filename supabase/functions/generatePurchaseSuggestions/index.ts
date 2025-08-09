import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { mama_id } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const { data } = await supabase
    .from("v_stock_theorique")
    .select("produit_id, stock_min, stock_projete, produit:produit_id(fournisseur_id)")
    .eq("mama_id", mama_id);

  const suggestions = [] as any[];
  for (const row of data || []) {
    if (Number(row.stock_projete) <= Number(row.stock_min)) {
      const qty = Number(row.stock_min) - Number(row.stock_projete);
      suggestions.push({
        produit_id: row.produit_id,
        fournisseur_id: row.produit?.fournisseur_id || null,
        quantite: qty > 0 ? qty : 0,
      });
    }
  }

  await supabase.from("logs_activite").insert({
    mama_id,
    action: "generate_purchase_suggestions",
    details: { count: suggestions.length },
  });

  return new Response(JSON.stringify({ suggestions }), {
    headers: { "Content-Type": "application/json" },
  });
});
