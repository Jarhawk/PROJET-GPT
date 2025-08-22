import { serve } from "https://deno.land/std/http/server.ts";
import { supabase } from "@/lib/supabase";

serve(async (req) => {
  const { mama_id } = await req.json();
  if (!mama_id) return new Response("mama_id requis", { status: 400 });


  const { data: produits } = await supabase
    .from("v_stock_theorique")
    .select("produit_id, stock_projete, stock_min")
    .eq("mama_id", mama_id);

  const suggestions: any[] = [];
  for (const p of produits ?? []) {
    if (p.stock_projete <= p.stock_min) {
      const { data: fp } = await supabase
        .from("fournisseur_produits")
        .select("fournisseur_id")
        .eq("produit_id", p.produit_id)
        .eq("mama_id", mama_id)
        .limit(1);
      suggestions.push({
        produit_id: p.produit_id,
        fournisseur_id: fp?.[0]?.fournisseur_id || null,
        quantite: (p.stock_min - p.stock_projete),
      });
    }
  }

  await supabase.from("logs_activite").insert({
    mama_id,
    type: "stock",
    module: "suggestions",
    description: "Génération des suggestions de commande",
    donnees: { count: suggestions.length },
  });

  return new Response(JSON.stringify({ suggestions }), {
    headers: { "Content-Type": "application/json" },
  });
});
