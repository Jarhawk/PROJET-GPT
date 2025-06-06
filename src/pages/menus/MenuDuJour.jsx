import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const FOOD_COST_SEUIL = 35; // seuil d'alerte en %

export default function MenuDuJour() {
  const { isAuthenticated, claims, loading: authLoading } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [todayMenu, setTodayMenu] = useState({ entree: "", plat: "", dessert: "" });
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [savingPV, setSavingPV] = useState(null);

  // Charger fiches actives (pour autocomplete)
  useEffect(() => {
    if (!claims?.mama_id) return;
    setLoading(true);
    supabase
      .from("fiches_techniques")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .eq("actif", true)
      .then(({ data }) => {
        setFiches(data || []);
        setLoading(false);
      });
  }, [claims?.mama_id]);

  // Charger archive menus du jour
  useEffect(() => {
    if (!claims?.mama_id) return;
    supabase
      .from("menus_jour")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .order("date_menu", { ascending: false })
      .then(({ data }) => setArchive(data || []));
  }, [claims?.mama_id]);

  // Sélection d’une fiche pour une des trois catégories
  const handleSelect = (type, value) => {
    setTodayMenu(m => ({ ...m, [type]: value }));
  };

  // Sauvegarder menu du jour (archive)
  const handleSaveMenu = async () => {
    const entree = fiches.find(f => f.id === todayMenu.entree);
    const plat = fiches.find(f => f.id === todayMenu.plat);
    const dessert = fiches.find(f => f.id === todayMenu.dessert);

    if (!entree || !plat || !dessert) {
      toast.error("Sélectionne une fiche pour chaque catégorie !");
      return;
    }

    const { error } = await supabase.from("menus_jour").insert([{
      mama_id: claims.mama_id,
      date_menu: new Date().toISOString().slice(0, 10),
      entree_id: entree.id,
      plat_id: plat.id,
      dessert_id: dessert.id,
      entree_nom: entree.nom,
      plat_nom: plat.nom,
      dessert_nom: dessert.nom,
      entree_cout_portion: entree.cout_portion,
      plat_cout_portion: plat.cout_portion,
      dessert_cout_portion: dessert.cout_portion,
      entree_prix_vente: entree.prix_vente,
      plat_prix_vente: plat.prix_vente,
      dessert_prix_vente: dessert.prix_vente,
      created_by: claims.user_id,
    }]);
    if (error) toast.error(error.message);
    else {
      toast.success("Menu du jour enregistré !");
      setArchive(a => [{
        date_menu: new Date().toISOString().slice(0, 10),
        entree_nom: entree.nom,
        plat_nom: plat.nom,
        dessert_nom: dessert.nom,
        entree_cout_portion: entree.cout_portion,
        plat_cout_portion: plat.cout_portion,
        dessert_cout_portion: dessert.cout_portion,
        entree_prix_vente: entree.prix_vente,
        plat_prix_vente: plat.prix_vente,
        dessert_prix_vente: dessert.prix_vente,
      }, ...a]);
    }
  };

  // Edition rapide PV
  const handleChangePV = async (ficheId, newPV) => {
    setSavingPV(ficheId);
    const { error } = await supabase
      .from("fiches_techniques")
      .update({ prix_vente: newPV })
      .eq("id", ficheId)
      .eq("mama_id", claims.mama_id);
    if (!error) {
      setFiches(prev =>
        prev.map(f =>
          f.id === ficheId ? { ...f, prix_vente: newPV } : f
        )
      );
      toast.success("Prix de vente enregistré !");
    } else {
      toast.error(error.message);
    }
    setSavingPV(null);
  };

  // Export PDF de l'historique des menus du jour
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Historique des menus du jour", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [["Date", "Entrée", "Coût/portion", "PV", "Plat", "Coût/portion", "PV", "Dessert", "Coût/portion", "PV"]],
      body: archive.map(a => [
        a.date_menu,
        a.entree_nom,
        a.entree_cout_portion ? Number(a.entree_cout_portion).toFixed(2) : "-",
        a.entree_prix_vente ? Number(a.entree_prix_vente).toFixed(2) : "-",
        a.plat_nom,
        a.plat_cout_portion ? Number(a.plat_cout_portion).toFixed(2) : "-",
        a.plat_prix_vente ? Number(a.plat_prix_vente).toFixed(2) : "-",
        a.dessert_nom,
        a.dessert_cout_portion ? Number(a.dessert_cout_portion).toFixed(2) : "-",
        a.dessert_prix_vente ? Number(a.dessert_prix_vente).toFixed(2) : "-",
      ]),
      styles: { fontSize: 9 }
    });
    doc.save("Historique_menus_jour.pdf");
    toast.success("Export PDF généré !");
  };

  // Calculs food cost et alertes pour chaque menu du jour archivé
  const computeFoodCost = a => {
    const entreeFC = a.entree_prix_vente ? (a.entree_cout_portion / a.entree_prix_vente) * 100 : null;
    const platFC = a.plat_prix_vente ? (a.plat_cout_portion / a.plat_prix_vente) * 100 : null;
    const dessertFC = a.dessert_prix_vente ? (a.dessert_cout_portion / a.dessert_prix_vente) * 100 : null;
    return { entreeFC, platFC, dessertFC };
  };

  // Statistiques globales
  const stats = (() => {
    let n = archive.length;
    let sumFC = 0, countFC = 0;
    archive.forEach(a => {
      const { entreeFC, platFC, dessertFC } = computeFoodCost(a);
      [entreeFC, platFC, dessertFC].forEach(fc => {
        if (fc !== null && !isNaN(fc)) { sumFC += fc; countFC++; }
      });
    });
    return {
      menuCount: n,
      avgFoodCost: countFC ? (sumFC / countFC) : 0
    };
  })();

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Menu du jour</h1>
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col gap-4">
        <h2 className="font-bold">Sélection du jour</h2>
        {["entree", "plat", "dessert"].map(type => (
          <div key={type}>
            <label className="font-medium capitalize">
              {type} :
              <select
                className="select select-bordered ml-2"
                value={todayMenu[type]}
                onChange={e => handleSelect(type, e.target.value)}
              >
                <option value="">— Choisir —</option>
                {fiches.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nom} ({Number(f.cout_portion).toFixed(2)} € / portion)
                    {f.prix_vente ? `, PV: ${Number(f.prix_vente).toFixed(2)} €` : ""}
                  </option>
                ))}
              </select>
              &nbsp;
              {/* Edition rapide PV inline */}
              {todayMenu[type] && (
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="input input-bordered w-20"
                  value={fiches.find(f => f.id === todayMenu[type])?.prix_vente ?? ""}
                  disabled={savingPV === todayMenu[type]}
                  onChange={e => handleChangePV(todayMenu[type], e.target.value ? Number(e.target.value) : null)}
                  placeholder="PV"
                  style={{ marginLeft: 8 }}
                />
              )}
            </label>
          </div>
        ))}
        <Button onClick={handleSaveMenu}>Enregistrer menu du jour</Button>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={() => setShowStats(!showStats)}>
          {showStats ? "Masquer" : "Afficher"} les statistiques globales
        </Button>
        <Button variant="outline" onClick={handleExportPDF}>
          Exporter PDF historique
        </Button>
      </div>
      {/* Statistiques globales */}
      {showStats && (
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="font-bold mb-2">Statistiques globales des menus du jour</h2>
          <p>Nombre de menus archivés : <b>{stats.menuCount}</b></p>
          <p>Food cost moyen (entrée, plat, dessert) : <b>{stats.avgFoodCost.toFixed(1)} %</b></p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={archive.map(a => {
                const { entreeFC, platFC, dessertFC } = computeFoodCost(a);
                return {
                  date: a.date_menu,
                  Entrée: entreeFC,
                  Plat: platFC,
                  Dessert: dessertFC
                };
              })}
            >
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Entrée" fill="#e2ba63" />
              <Bar dataKey="Plat" fill="#bfa14d" />
              <Bar dataKey="Dessert" fill="#eb6e34" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <h2 className="text-lg font-bold mb-2">Historique des menus du jour</h2>
      <div className="bg-white rounded-xl shadow p-4">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Entrée</th>
              <th className="px-2 py-1">Coût/portion</th>
              <th className="px-2 py-1">PV</th>
              <th className="px-2 py-1">FC (%)</th>
              <th className="px-2 py-1">Plat</th>
              <th className="px-2 py-1">Coût/portion</th>
              <th className="px-2 py-1">PV</th>
              <th className="px-2 py-1">FC (%)</th>
              <th className="px-2 py-1">Dessert</th>
              <th className="px-2 py-1">Coût/portion</th>
              <th className="px-2 py-1">PV</th>
              <th className="px-2 py-1">FC (%)</th>
            </tr>
          </thead>
          <tbody>
            {archive.length === 0 && (
              <tr>
                <td colSpan={13} className="py-4 text-gray-500">
                  Aucun menu archivé.
                </td>
              </tr>
            )}
            {archive.map(a => {
              const { entreeFC, platFC, dessertFC } = computeFoodCost(a);
              return (
                <tr key={a.date_menu + a.entree_nom + a.plat_nom + a.dessert_nom}>
                  <td className="px-2 py-1 font-semibold">{a.date_menu}</td>
                  <td className="px-2 py-1">{a.entree_nom}</td>
                  <td className="px-2 py-1">{a.entree_cout_portion ? Number(a.entree_cout_portion).toFixed(2) : "-"}</td>
                  <td className="px-2 py-1">{a.entree_prix_vente ? Number(a.entree_prix_vente).toFixed(2) : "-"}</td>
                  <td className={"px-2 py-1 font-semibold " + (entreeFC > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                    {entreeFC ? entreeFC.toFixed(1) : "-"}
                  </td>
                  <td className="px-2 py-1">{a.plat_nom}</td>
                  <td className="px-2 py-1">{a.plat_cout_portion ? Number(a.plat_cout_portion).toFixed(2) : "-"}</td>
                  <td className="px-2 py-1">{a.plat_prix_vente ? Number(a.plat_prix_vente).toFixed(2) : "-"}</td>
                  <td className={"px-2 py-1 font-semibold " + (platFC > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                    {platFC ? platFC.toFixed(1) : "-"}
                  </td>
                  <td className="px-2 py-1">{a.dessert_nom}</td>
                  <td className="px-2 py-1">{a.dessert_cout_portion ? Number(a.dessert_cout_portion).toFixed(2) : "-"}</td>
                  <td className="px-2 py-1">{a.dessert_prix_vente ? Number(a.dessert_prix_vente).toFixed(2) : "-"}</td>
                  <td className={"px-2 py-1 font-semibold " + (dessertFC > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                    {dessertFC ? dessertFC.toFixed(1) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
