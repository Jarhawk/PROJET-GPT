// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export async function getRecommendations(user_id, mama_id) {
  if (!mama_id) return [];
  const recos = [];

  // 1. Stock mort via view
  const { data: stockMort } = await supabase
    .from('v_reco_stockmort')
    .select('*')
    .eq('mama_id', mama_id);

  (stockMort || []).forEach(r => {
    recos.push({
      type: 'alert',
      category: 'rotation',
      produit_id: r.produit_id,
      message: `Stock mort: ${r.nom} inactif depuis ${r.jours_inactif} jours`,
    });
  });

  // 2. Surcoût
  const { data: surcout } = await supabase
    .from('v_reco_surcout')
    .select('*')
    .eq('mama_id', mama_id)
    .gte('variation_pct', 20);

  (surcout || []).forEach(r => {
    recos.push({
      type: 'alert',
      category: 'coût',
      produit_id: r.produit_id,
      message: `Coût excessif pour ${r.nom} : +${Number(r.variation_pct).toFixed(1)}%`,
    });
  });

  // 3. Suggest reorder when stock below minimum
  const { data: produits } = await supabase
    .from('produits')
    .select('id, nom, stock_reel, stock_min, actif')
    .eq('mama_id', mama_id);

  (produits || [])
    .filter(p => p.actif && p.stock_min !== null && Number(p.stock_reel) < Number(p.stock_min))
    .forEach(p => {
      recos.push({
        type: 'suggestion',
        category: 'stock',
        produit_id: p.id,
        message: `Passer commande: ${p.nom} (stock ${p.stock_reel} < ${p.stock_min})`,
      });
    });

  // 4. Budget deviation
  const periode = new Date().toISOString().slice(0,7);
  const { data: budgets } = await supabase.rpc('fn_calc_budgets', {
    mama_id_param: mama_id,
    periode_param: periode,
  });

  (budgets || [])
    .filter(b => b.ecart_pct !== null && Math.abs(Number(b.ecart_pct)) > 15)
    .forEach(b => {
      recos.push({
        type: 'alert',
        category: 'budget',
        message: `Ecart budget ${b.famille}: ${Number(b.ecart_pct).toFixed(1)}%`,
      });
    });

  return recos;
}

export function useRecommendations() {
  const { user_id, mama_id } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const recos = await getRecommendations(user_id, mama_id);
    setItems(recos);
    setLoading(false);
  };

  useEffect(() => {
    if (mama_id) refresh();
  }, [mama_id]);

  return { recommendations: items, loading, refresh };
}

