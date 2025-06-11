import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useDashboard() {
  const { user } = useAuth();
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

  async function fetchDashboard(caFnbInput) {
    setLoading(true);

    let mama_id = user?.mama_id;

    // 1. Récupère produits (toujours fallback tableau vide)
    const { data: produitsRaw, error: errorProd } = await supabase
      .from("products")
      .select("id, nom, famille, unite, pmp, stock_reel, stock_min")
      .eq("mama_id", mama_id);

    const produits = Array.isArray(produitsRaw) ? produitsRaw : [];

    // 2. Récupère mouvements
    const { data: mouvementsRaw, error: errorMouv } = await supabase
      .from("mouvements_stock")
      .select("type, quantite, product_id, date")
      .eq("mama_id", mama_id);

    const mouvements = Array.isArray(mouvementsRaw) ? mouvementsRaw : [];

    // 3. Statistiques de base
    const stock_valorise = produits.reduce((sum, p) => sum + (Number(p.pmp) || 0) * (Number(p.stock_reel) || 0), 0);
    const moisCourant = new Date().toISOString().slice(0, 7);
    const conso_mois = mouvements
      .filter(m => m.date && m.date.startsWith(moisCourant) && m.type === "sortie")
      .reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);
    const nb_mouvements = mouvements.length;
    setStats({ stock_valorise, conso_mois, nb_mouvements, ca_fnb: caFnbInput });

    // 4. Top produits consommés
    let topProductsData = [];
    produits.forEach(p => {
      const total = mouvements.filter(m => m.product_id === p.id && m.type === "sortie")
        .reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);
      if (total > 0)
        topProductsData.push({ nom: p.nom, total, unite: p.unite, id: p.id });
    });
    topProductsData = topProductsData.sort((a, b) => b.total - a.total).slice(0, 8);
    setTopProducts(topProductsData);

    // 5. Food cost global & par famille
    const ca_fnb = Number(caFnbInput) || 1;
    const familles = [...new Set(produits.map(p => p.famille).filter(Boolean))];
    let consoByFamille = {};
    familles.forEach(fam => {
      const ids = produits.filter(p => p.famille === fam).map(p => p.id);
      const total = mouvements
        .filter(m => ids.includes(m.product_id) && m.date?.startsWith(moisCourant) && m.type === "sortie")
        .reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);
      consoByFamille[fam] = total;
    });
    const consoAlim = familles.includes("Alimentaire")
      ? consoByFamille["Alimentaire"] || 0
      : Object.values(consoByFamille).reduce((sum, v) => sum + v, 0); // fallback

    setFoodCostGlobal(ca_fnb ? consoAlim / ca_fnb : 0);

    setFoodCostParFamille(
      familles.map(fam => ({
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
    let moisArray = [];
    let evolutionStockData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mois = d.toISOString().slice(0, 7);
      moisArray.push(mois);
      evolutionStockData.push({
        mois,
        stock_valorise: stock_valorise // Optionnel : historiser
      });
    }
    setEvolutionStock(evolutionStockData);

    // 8. Évolution consommation (par mois, 12 mois)
    let evolutionConsoData = moisArray.map(mois => ({
      mois,
      conso: mouvements
        .filter(m => m.date && m.date.startsWith(mois) && m.type === "sortie")
        .reduce((sum, m) => sum + (Number(m.quantite) || 0), 0)
    }));
    setEvolutionConso(evolutionConsoData);

    // 9. Évolution food cost
    let evolFoodCost = moisArray.map(mois => {
      // Dummy CA = ca_fnb pour tous les mois (à historiser si besoin)
      const caDummy = ca_fnb;
      const conso = mouvements
        .filter(m => m.date?.startsWith(mois) && m.type === "sortie")
        .reduce((sum, m) => sum + (Number(m.quantite) || 0), 0);
      return { mois, food_cost: caDummy ? conso / caDummy : 0 };
    });
    setEvolutionFoodCost(evolFoodCost);

    // 10. Alertes stocks bas
    setAlertesStockBas(
      produits.filter(p =>
        (typeof p.stock_min === "number") &&
        typeof p.stock_reel === "number" &&
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
    fetchDashboard,
    exportExcelDashboard,
  };
}
