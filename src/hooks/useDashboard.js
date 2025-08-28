// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useDashboard() {
  const { mama_id, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({});
  const [evolutionStock, setEvolutionStock] = useState([]);
  const [evolutionConso, setEvolutionConso] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [foodCostGlobal, setFoodCostGlobal] = useState(0);
  const [foodCostParFamille, setFoodCostParFamille] = useState([]);
  const [evolutionFoodCost, setEvolutionFoodCost] = useState([]);
  const [margeBrute, setMargeBrute] = useState({ valeur: 0, taux: 0 });
  const [alertesStockBas, setAlertesStockBas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // fetchDashboard s'exécute UNIQUEMENT quand mama_id prêt
  async function fetchDashboard(caFnbInput) {
    if (!mama_id || authLoading) return;
    setLoading(true);
    setError(null);

    // 1. Récupère produits
    let produits = [];
    let mouvements = [];
    try {
      const { data: produitsRaw, error: errorProd } = await supabase
        .from('v_produits_dernier_prix')
        .select('id:produit_id, nom, famille, unite, stock_reel, stock_min, mama_id')
        .eq('mama_id', mama_id);
      if (errorProd) throw errorProd;
      const { data: pmpData } = await supabase
        .from('v_pmp')
        .select('produit_id, pmp')
        .eq('mama_id', mama_id);
      const { data: stockData } = await supabase
        .from('v_stocks')
        .select('produit_id, stock')
        .eq('mama_id', mama_id);
      const pmpArr = Array.isArray(pmpData) ? pmpData : [];
      const stockArr = Array.isArray(stockData) ? stockData : [];
      const pmpMap = Object.fromEntries(pmpArr.map(p => [p.produit_id, p.pmp]));
      const stockMap = Object.fromEntries(stockArr.map(s => [s.produit_id, s.stock]));
      const produitsBruts = Array.isArray(produitsRaw) ? produitsRaw : [];
      produits = produitsBruts.map(p => ({
        ...p,
        pmp: pmpMap[p.id] ?? 0,
        stock_theorique: stockMap[p.id] ?? 0,
      }));
    } catch (_err) { void _err;
      setError("Erreur chargement produits");
      setLoading(false);
      return;
    }

    // 2. Récupère consommations via requisitions
    try {
      const { data: mouvementsRaw, error: errorMouv } = await supabase
        .from('requisition_lignes')
        .select(
          'quantite, produit_id, requisitions!inner(date_requisition,mama_id,statut)'
        )
        .eq('mama_id', mama_id)
        .eq('requisitions.mama_id', mama_id);
      if (errorMouv) throw errorMouv;
      mouvements = (Array.isArray(mouvementsRaw) ? mouvementsRaw : [])
        .filter(m => m.requisitions?.statut === 'réalisée')
        .map(m => ({
          quantite: m.quantite,
          produit_id: m.produit_id,
          type: 'sortie',
          date: m.requisitions.date_requisition,
        }));
    } catch (_err) {
      setError('Erreur chargement mouvements');
      void _err;
      setLoading(false);
      return;
    }

    // 3. Statistiques de base
    const produitsArr = Array.isArray(produits) ? produits : [];
    const mouvementsArr = Array.isArray(mouvements) ? mouvements : [];
    const stock_valorise = produitsArr.reduce(
      (sum, p) => sum + (Number(p.pmp) || 0) * (Number(p.stock_reel) || 0),
      0
    );
    const moisCourant = new Date().toISOString().slice(0, 7);
    const conso_mois = mouvementsArr
      .filter((m) => m.date && m.date.startsWith(moisCourant) && m.type === 'sortie')
      .reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);
    const nb_mouvements = mouvementsArr.length;
    setStats({ stock_valorise, conso_mois, nb_mouvements, ca_fnb: caFnbInput });

    // 4. Top produits consommés calculés côté client
    const topCounts = mouvementsArr
      .filter((m) => m.type === 'sortie')
      .reduce((acc, m) => {
        acc[m.produit_id] = (acc[m.produit_id] || 0) + (Number(m.quantite) || 0);
        return acc;
      }, {});
    const topData = Object.entries(topCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([produit_id, quantite]) => ({ produit_id, quantite }));
    setTopProducts(topData);

    // 5. Food cost global & par famille
    const ca_fnb = Number(caFnbInput) || 1;
    const familles = Array.isArray(produitsArr)
      ? [...new Set(produitsArr.map((p) => p.famille).filter(Boolean))]
      : [];
    const famillesArr = Array.isArray(familles) ? familles : [];
    let consoByFamille = {};
    famillesArr.forEach((fam) => {
      const ids = produitsArr.filter((p) => p.famille === fam).map((p) => p.id);
      const total = mouvementsArr
        .filter((m) => ids.includes(m.produit_id) && m.date?.startsWith(moisCourant) && m.type === 'sortie')
        .reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);
      consoByFamille[fam] = total;
    });
    const consoAlim = famillesArr.includes('Alimentaire')
      ? consoByFamille['Alimentaire'] || 0
      : Object.values(consoByFamille).reduce((sum, v) => sum + v, 0);

    setFoodCostGlobal(ca_fnb ? consoAlim / ca_fnb : 0);

    setFoodCostParFamille(
      famillesArr.map((fam) => ({
        famille: fam,
        food_cost: ca_fnb ? (consoByFamille[fam] || 0) / ca_fnb : 0,
      }))
    );

    // 6. Marge brute
    setMargeBrute({
      valeur: ca_fnb - consoAlim,
      taux: ca_fnb ? (ca_fnb - consoAlim) / ca_fnb : 0,
    });

    // 7. Évolution valorisation stock (par mois, 12 mois)
    const moisArray = [];
    const evolutionStockData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mois = d.toISOString().slice(0, 7);
      moisArray.push(mois);
      evolutionStockData.push({
        mois,
        stock_valorise: stock_valorise // Pas d’historique stock par défaut
      });
    }
    setEvolutionStock(evolutionStockData);

    const moisArr = Array.isArray(moisArray) ? moisArray : [];
    // 8. Évolution consommation (par mois, 12 mois)
    const evolutionConsoData = moisArr.map((mois) => ({
      mois,
      conso: mouvementsArr
        .filter((m) => m.date && m.date.startsWith(mois) && m.type === 'sortie')
        .reduce((sum, m) => sum + (Number(m.quantite) || 0), 0),
    }));
    setEvolutionConso(evolutionConsoData);

    // 9. Évolution food cost
    const evolFoodCost = moisArr.map((mois) => {
      const caDummy = ca_fnb;
      const conso = mouvementsArr
        .filter((m) => m.date?.startsWith(mois) && m.type === 'sortie')
        .reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);
      return { mois, food_cost: caDummy ? conso / caDummy : 0 };
    });
    setEvolutionFoodCost(evolFoodCost);

    // 10. Alertes stocks bas
    setAlertesStockBas(
      produitsArr.filter(
        (p) =>
          typeof p.stock_min === 'number' &&
          typeof p.stock_reel === 'number' &&
          p.stock_reel < p.stock_min
      )
    );

    setLoading(false);
  }

  function exportExcelDashboard() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([stats]), "Stats");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(evolutionStock), "Evol_Stock");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(evolutionConso), "Evol_Conso");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(foodCostParFamille), "FoodCostFamille");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topProducts), "Top_Produits");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alertesStockBas), "AlertesStockBas");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "dashboard_mamastock.xlsx");
  }

  return {
    stats,
    evolutionStock,
    evolutionConso,
    topProducts,
    foodCostGlobal,
    foodCostParFamille,
    evolutionFoodCost,
    margeBrute,
    alertesStockBas,
    loading,
    error,
    fetchDashboard,
    exportExcelDashboard,
  };
}
