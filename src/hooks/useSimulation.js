// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useSimulation.js
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const useSimulation = () => {
  const { mama_id } = useAuth();
  const [selection, setSelection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addRecipe = (recette) => {
    if (!Array.isArray(selection)) return;
    let exists = false;
    for (const r of selection) {
      if (r.id === recette.id) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      setSelection([...selection, { ...recette, prix: 0 }]);
    }
  };

  const removeRecipe = (id) => {
    setSelection((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const out = [];
      for (const r of arr) {
        if (r.id !== id) out.push(r);
      }
      return out;
    });
  };

  const setPrix = (id, prix) => {
    setSelection((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const out = [];
      for (const r of arr) {
        if (r.id === id) {
          out.push({ ...r, prix: parseFloat(prix) || 0 });
        } else {
          out.push(r);
        }
      }
      return out;
    });
  };

  const totalCout = Array.isArray(selection)
    ? selection.reduce((acc, r) => acc + (r.cout_total || 0), 0)
    : 0;
  const totalPrix = Array.isArray(selection)
    ? selection.reduce((acc, r) => acc + (r.prix || 0), 0)
    : 0;
  const marge = totalPrix - totalCout;
  const margePourcent = totalPrix > 0 ? ((marge / totalPrix) * 100).toFixed(1) : 0;

  const details = [];
  if (Array.isArray(selection)) {
    for (const r of selection) {
      details.push({
        nom: r.nom,
        cout: r.cout_total || 0,
        prix: r.prix || 0,
        portions: r.portions || 1,
        coutParPortion: r.portions ? (r.cout_total || 0) / r.portions : 0,
      });
    }
  }

  async function getBesoinsParMenu(menuId, nbPortions = 1) {
    if (!mama_id || !menuId) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("v_besoins_previsionnels")
      .select("mama_id, menu_id, produit_id, quantite, valeur")
      .eq("mama_id", mama_id)
      .eq("menu_id", menuId);
    setLoading(false);
    if (error) {
      setError(error.message || error);
      return [];
    }
    if (!Array.isArray(data)) return [];
    const out = [];
    for (const row of data) {
      out.push({
        ...row,
        quantite: (Number(row.quantite) || 0) * nbPortions,
      });
    }
    return out;
  }

  async function simulerBudget(periode = {}, scenario = []) {
    if (!mama_id) return { produits: [], total: 0 };
    setLoading(true);
    setError(null);
    const produits = [];
    if (Array.isArray(scenario)) {
      for (const item of scenario) {
        const besoins = await getBesoinsParMenu(item.menu_id, item.portions || 1);
        if (Array.isArray(besoins)) {
          for (const b of besoins) produits.push(b);
        }
      }
    }
    let total = 0;
    for (const p of produits) {
      total += (Number(p.valeur) || 0) * (Number(p.quantite) || 0);
    }
    setLoading(false);
    return { produits, total, periode };
  }

  async function proposerCommandes(consommationProjetee = []) {
    if (!mama_id) return [];
    if (!Array.isArray(consommationProjetee)) return [];
    const commandes = [];
    for (const p of consommationProjetee) {
      commandes.push({ produit_id: p.produit_id, quantite: p.quantite });
    }
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
