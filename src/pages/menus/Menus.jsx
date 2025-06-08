import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const FOOD_COST_SEUIL = 35;

export default function Menus() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [fichesById, setFichesById] = useState({});
  const [menus, setMenus] = useState([]);
  const [menuId, setMenuId] = useState("");
  const [menuNom, setMenuNom] = useState("");
  const [menu, setMenu] = useState([]); // [{ ficheId, quantite }]
  const [pvGlobal, setPvGlobal] = useState(""); // prix vente global (optionnel)
  const [searchValue, setSearchValue] = useState("");
  const [savingPV, setSavingPV] = useState(null);

  // 1. Charger toutes les fiches techniques
  useEffect(() => {
    if (!claims?.mama_id) return;
    supabase
      .from("fiches_techniques")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .eq("actif", true)
      .then(({ data }) => {
        setFiches(data || []);
        setFichesById(Object.fromEntries((data || []).map(f => [f.id, f])));
      });
  }, [claims?.mama_id]);

  // 2. Charger tous les menus enregistrés
  useEffect(() => {
    if (!claims?.mama_id) return;
    supabase
      .from("menus")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMenus(data || []);
      });
  }, [claims?.mama_id]);

  // 3. Charger menu sélectionné
  useEffect(() => {
    if (!menuId || !menus.length) { setMenu([]); setPvGlobal(""); return; }
    const m = menus.find(m => m.id === menuId);
    if (!m) { setMenu([]); setPvGlobal(""); return; }
    setMenu((m.lignes || []).map(l => ({
      ficheId: l.fiche_id,
      quantite: l.quantite,
    })));
    setPvGlobal(m.pv_global || "");
  }, [menuId, menus]);

  // Création menu
  const handleCreateMenu = async () => {
    if (!menuNom) { toast.error("Nom du menu obligatoire"); return; }
    const { data, error } = await supabase
      .from("menus")
      .insert([{
        mama_id: claims.mama_id,
        nom: menuNom,
        lignes: [],
        pv_global: null,
        created_by: claims.user_id
      }]).select().single();
    if (error) { toast.error(error.message); return; }
    setMenus(prev => [data, ...prev]);
    setMenuId(data.id);
    setMenu([]);
    setPvGlobal("");
    setMenuNom("");
    toast.success("Menu créé !");
  };

  // Sauvegarder le menu courant
  const handleSaveMenu = async () => {
    if (!menuId) return;
    const lignes = menu.map(m => ({
      fiche_id: m.ficheId,
      quantite: m.quantite,
    }));
    const { error } = await supabase
      .from("menus")
      .update({ lignes, pv_global: pvGlobal ? Number(pvGlobal) : null })
      .eq("id", menuId);
    if (!error) toast.success("Menu sauvegardé !");
    else toast.error(error.message);
  };

  // Supprimer un menu
  const handleDeleteMenu = async () => {
    if (!menuId) return;
    if (!window.confirm("Supprimer ce menu ?")) return;
    const { error } = await supabase.from("menus").delete().eq("id", menuId);
    if (!error) {
      setMenus(menus.filter(m => m.id !== menuId));
      setMenuId("");
      setMenu([]);
      setPvGlobal("");
      toast.success("Menu supprimé");
    } else toast.error(error.message);
  };

  // Ajout/retrait/édition fiches du menu courant
  const handleAddFiche = () => {
    const found = fiches.find(
      f =>
        f.nom.toLowerCase() === searchValue.toLowerCase() ||
        f.id === searchValue
    );
    if (found && !menu.some(m => m.ficheId === found.id)) {
      setMenu(prev => [...prev, { ficheId: found.id, quantite: 1 }]);
      setSearchValue("");
    } else if (!found) {
      toast.error("Fiche non trouvée.");
    } else {
      toast.error("Déjà dans le menu !");
    }
  };

  const handleChangeQuantite = (idx, qte) => {
    setMenu(prev => prev.map((m, i) => (i === idx ? { ...m, quantite: Number(qte) } : m)));
  };

  const handleRemoveFiche = (idx) => {
    setMenu(prev => prev.filter((_, i) => i !== idx));
  };

  // Edition rapide PV en base
  const handleChangePV = async (ficheId, newPV) => {
    setSavingPV(ficheId);
    const { error } = await supabase
      .from("fiches_techniques")
      .update({ prix_vente: newPV })
      .eq("id", ficheId)
      .eq("mama_id", claims.mama_id);
    if (!error) {
      setFichesById(prev => ({
        ...prev,
        [ficheId]: { ...prev[ficheId], prix_vente: newPV }
      }));
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

  // Calculs food cost
  const coutTotal = menu.reduce(
    (acc, m) => acc + (fichesById[m.ficheId]?.cout_total || 0) * m.quantite,
    0
  );
  const pvTotal = pvGlobal
    ? Number(pvGlobal)
    : menu.reduce(
        (acc, m) => acc + (Number(fichesById[m.ficheId]?.prix_vente) || 0) * m.quantite,
        0
      );
  const foodCost = pvTotal ? (coutTotal / pvTotal) * 100 : 0;

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Menu", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [["Plat", "Quantité", "Coût total (€)", "PV (€)", "Food cost (%)"]],
      body: menu.map(m => {
        const f = fichesById[m.ficheId];
        const pv = f?.prix_vente ? Number(f.prix_vente) : 0;
        const fc = pv ? ((f.cout_portion / pv) * 100).toFixed(1) : "";
        return [
          f?.nom || "",
          m.quantite,
          Number((f?.cout_total || 0) * m.quantite).toFixed(2),
          pv ? pv.toFixed(2) : "-",
          fc
        ];
      }),
      styles: { fontSize: 10 },
    });
    doc.text(`Total coût matière : ${coutTotal.toFixed(2)} €`, 10, doc.lastAutoTable.finalY + 10);
    doc.text(`Total prix de vente : ${pvTotal.toFixed(2)} €`, 10, doc.lastAutoTable.finalY + 16);
    doc.text(`Food cost global : ${foodCost.toFixed(1)} %`, 10, doc.lastAutoTable.finalY + 22);
    doc.save("Menu.pdf");
    toast.success("Export PDF généré !");
  };

  // Export Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      menu.map(m => {
        const f = fichesById[m.ficheId];
        const pv = f?.prix_vente ? Number(f.prix_vente) : 0;
        const fc = pv ? ((f.cout_portion / pv) * 100).toFixed(1) : "";
        return {
          Plat: f?.nom || "",
          Quantité: m.quantite,
          "Coût total (€)": Number((f?.cout_total || 0) * m.quantite).toFixed(2),
          "PV (€)": pv ? pv.toFixed(2) : "-",
          "Food cost (%)": fc,
        };
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Menu");
    XLSX.writeFile(wb, "Menu.xlsx");
    toast.success("Export Excel généré !");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Toaster />
        <span className="text-mamastock-gold animate-pulse">Chargement menu...</span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-6">Menus / Cartes (gestion avancée)</h1>
      {/* Sélection menu */}
      <div className="flex gap-2 mb-4 items-center">
        <select
          className="select select-bordered"
          value={menuId}
          onChange={e => setMenuId(e.target.value)}
        >
          <option value="">— Sélectionner un menu —</option>
          {menus.map(m => (
            <option key={m.id} value={m.id}>
              {m.nom} ({new Date(m.created_at).toLocaleDateString()})
            </option>
          ))}
        </select>
        <input
          className="input input-bordered w-56"
          placeholder="Nouveau menu (nom)..."
          value={menuNom}
          onChange={e => setMenuNom(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCreateMenu()}
        />
        <Button onClick={handleCreateMenu} disabled={!menuNom}>Créer</Button>
        <Button variant="destructive" onClick={handleDeleteMenu} disabled={!menuId}>Supprimer menu</Button>
      </div>

      {/* Ajout plat */}
      {menuId && (
        <>
          <div className="flex gap-2 mb-4">
            <input
              className="input input-bordered w-80"
              placeholder="Ajouter un plat (recherche nom fiche)..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              list="fiches-list"
              onKeyDown={e => e.key === "Enter" && handleAddFiche()}
            />
            <datalist id="fiches-list">
              {fiches.map(f => (
                <option key={f.id} value={f.nom} />
              ))}
            </datalist>
            <Button variant="secondary" onClick={handleAddFiche}>Ajouter</Button>
            <Button variant="outline" onClick={handleSaveMenu}>Sauvegarder menu</Button>
            <Button variant="outline" onClick={handleExportExcel}>Exporter Excel</Button>
            <Button variant="outline" onClick={handleExportPDF}>Exporter PDF</Button>
          </div>
          <div className="bg-white shadow rounded-xl p-4 mb-6 overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th className="px-3 py-2">Plat / Fiche</th>
                  <th className="px-3 py-2">Quantité</th>
                  <th className="px-3 py-2">Coût total (€)</th>
                  <th className="px-3 py-2">Prix de vente (€)</th>
                  <th className="px-3 py-2">Food cost (%)</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {menu.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      Aucun plat sélectionné.
                    </td>
                  </tr>
                )}
                {menu.map((m, idx) => {
                  const fiche = fichesById[m.ficheId];
                  const pv = fiche?.prix_vente ? Number(fiche.prix_vente) : 0;
                  const foodCost =
                    pv && fiche?.cout_portion
                      ? ((fiche.cout_portion / pv) * 100).toFixed(1)
                      : null;
                  return (
                    <tr key={m.ficheId}>
                      <td className="px-3 py-2">{fiche?.nom}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          className="input input-bordered w-20"
                          value={m.quantite}
                          onChange={e => handleChangeQuantite(idx, e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {fiche
                          ? Number((fiche.cout_total || 0) * m.quantite).toFixed(2)
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="input input-bordered w-24"
                          value={fiche?.prix_vente ?? ""}
                          disabled={savingPV === fiche?.id}
                          onChange={e => handleChangePV(fiche.id, e.target.value ? Number(e.target.value) : null)}
                        />
                      </td>
                      <td className={"px-3 py-2 font-semibold " + (foodCost > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                        {foodCost ?? "-"}
                      </td>
                      <td className="px-3 py-2">
                        <Button variant="destructive" size="sm" onClick={() => handleRemoveFiche(idx)}>Retirer</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* PV global */}
          <div className="flex gap-4 items-center mb-4">
            <span>Prix de vente global (optionnel)&nbsp;:</span>
            <input
              className="input input-bordered w-32"
              type="number"
              min={0}
              value={pvGlobal}
              onChange={e => setPvGlobal(e.target.value)}
              placeholder="Total €"
            />
            <span className="text-sm text-gray-500">
              (Si renseigné, remplace les prix/plat pour calcul global)
            </span>
          </div>
          {/* Stats */}
          <div className="bg-white shadow rounded-xl p-4 mb-8">
            <h2 className="font-bold mb-2">Statistiques du menu</h2>
            <p><strong>Coût matière total menu :</strong> {coutTotal.toFixed(2)} €</p>
            <p><strong>Total prix de vente :</strong> {pvTotal.toFixed(2)} €</p>
            <p>
              <strong>Food cost global :</strong>{" "}
              <span className={foodCost > FOOD_COST_SEUIL ? "text-red-600 font-semibold" : ""}>
                {foodCost ? foodCost.toFixed(1) : "-"} %
              </span>
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={menu.map(m => ({
                  nom: fichesById[m.ficheId]?.nom || "",
                  cout: Number((fichesById[m.ficheId]?.cout_total || 0) * m.quantite),
                }))}
              >
                <XAxis dataKey="nom" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cout" fill="#bfa14d" name="Coût total (€)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
