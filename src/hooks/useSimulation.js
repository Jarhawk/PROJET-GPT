// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useSimulation.js
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useSimulation = () => {
  const { mama_id } = useAuth();
  const [selection, setSelection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addRecipe = (recette) => {
    if (!selection.find((r) => r.id === recette.id)) {
      setSelection([...selection, { ...recette, prix: 0 }]);
    }
  };

  const removeRecipe = (id) => {
    setSelection((prev) => prev.filter((r) => r.id !== id));
  };

  const setPrix = (id, prix) => {
    setSelection((prev) =>
      prev.map((r) => (r.id === id ? { ...r, prix: parseFloat(prix) || 0 } : r))
    );
  };

  const totalCout = selection.reduce((acc, r) => acc + (r.cout_total || 0), 0);
  const totalPrix = selection.reduce((acc, r) => acc + (r.prix || 0), 0);
  const marge = totalPrix - totalCout;
  const margePourcent = totalPrix > 0 ? ((marge / totalPrix) * 100).toFixed(1) : 0;

  const details = selection.map((r) => ({
    nom: r.nom,
    cout: r.cout_total || 0,
    prix: r.prix || 0,
    portions: r.portions || 1,
    coutParPortion: r.portions ? (r.cout_total || 0) / r.portions : 0,
  }));

  async function getBesoinsParMenu(menuId, nbPortions = 1) {
    if (!mama_id || !menuId) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("v_besoins_previsionnels")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("menu_id", menuId);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return [];
    }
    return (data || []).map((row) => ({
      ...row,
      quantite: (Number(row.quantite) || 0) * nbPortions,
    }));
  }

  async function simulerBudget(periode = {}, scenario = []) {
    if (!mama_id) return { produits: [], total: 0 };
    setLoading(true);
    setError(null);
    let produits = [];
    for (const item of scenario) {
      const besoins = await getBesoinsParMenu(item.menu_id, item.portions || 1);
      produits = produits.concat(besoins);
    }
    const total = produits.reduce(
      (sum, p) => sum + (Number(p.valeur) || 0) * (Number(p.quantite) || 0),
      0
    );
    setLoading(false);
    return { produits, total, periode };
  }

  async function proposerCommandes(consommationProjetee = []) {
    if (!mama_id) return [];
    const commandes = consommationProjetee.map((p) => ({
      product_id: p.product_id,
      quantite: p.quantite,
    }));
    return commandes;
  }

  return {
    selection,
    addRecipe,
    removeRecipe,
    setPrix,
    getBesoinsParMenu,
    simulerBudget,
    proposerCommandes,
    loading,
    error,
    results: {
      totalCout,
      totalPrix,
      marge,
      margePourcent,
      details,
    },
  };
};

export default useSimulation;
