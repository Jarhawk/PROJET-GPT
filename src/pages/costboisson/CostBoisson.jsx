import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { motion as _motion, AnimatePresence } from "framer-motion";

const FOOD_COST_SEUIL = 28;

export default function CostBoissons() {
  const { isAuthenticated, claims } = useAuth();
  const [boissons, setBoissons] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [ventes, setVentes] = useState([]);
  const [ventesInput, setVentesInput] = useState({});
  const [periode, setPeriode] = useState({ debut: "", fin: "" });

  // Charger boissons actives
  useEffect(() => {
    if (!claims?.mama_id) return;
    supabase
      .from("fiches_techniques")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .eq("actif", true)
      .ilike("famille", "%boisson%")
      .then(({ data }) => setBoissons(data || []));
  }, [claims?.mama_id]);

  // Charger stats ventes sur la période (top ventes, volumes)
  useEffect(() => {
    if (!claims?.mama_id) return;
    if (!periode.debut || !periode.fin) return setVentes([]);
    supabase
      .from("ventes_boissons")
      .select("boisson_id, quantite")
      .eq("mama_id", claims.mama_id)
      .gte("date_vente", periode.debut)
      .lte("date_vente", periode.fin)
      .then(({ data }) => setVentes(data || []));
  }, [claims?.mama_id, periode]);

  // Saisie rapide PV
  const handleChangePV = async (boisson, newPV) => {
    setSavingId(boisson.id);
    const { error } = await supabase
      .from("fiches_techniques")
      .update({ prix_vente: newPV })
      .eq("id", boisson.id)
      .eq("mama_id", claims.mama_id);
    if (!error) {
      setBoissons(prev =>
        prev.map(b =>
          b.id === boisson.id ? { ...b, prix_vente: newPV } : b
        )
      );
      toast.success("Prix de vente enregistré !");
    } else {
      toast.error(error.message);
    }
    setSavingId(null);
  };

  // Saisie ventes directe
  const handleVentesInput = (boissonId, value) => {
    setVentesInput(prev => ({ ...prev, [boissonId]: value }));
  };
  const handleSaveVente = async (boissonId) => {
    const quantite = Number(ventesInput[boissonId]);
    if (!quantite || quantite < 0) {
      toast.error("Saisir une quantité > 0");
      return;
    }
    const { error } = await supabase.from("ventes_boissons").insert([{
      mama_id: claims.mama_id,
      boisson_id: boissonId,
      quantite,
      date_vente: new Date().toISOString().slice(0, 10),
      created_by: claims.user_id,
    }]);
    if (!error) {
      toast.success("Vente enregistrée !");
      setVentesInput(prev => ({ ...prev, [boissonId]: "" }));
    } else {
      toast.error(error.message);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const filtered = filterBoissons();
    const ws = XLSX.utils.json_to_sheet(
      filtered.map(b => ({
        Nom: b.nom,
        Type: b.type || b.famille || "",
        Contenance: b.unite || "",
        "Coût/portion (€)": b.cout_portion ? Number(b.cout_portion).toFixed(2) : "",
        "Prix vente (€)": b.prix_vente ? Number(b.prix_vente).toFixed(2) : "",
        "Food cost (%)":
          b.prix_vente && b.cout_portion
            ? ((b.cout_portion / b.prix_vente) * 100).toFixed(1)
            : "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Boissons");
    XLSX.writeFile(wb, "Boissons.xlsx");
    toast.success("Export Excel généré !");
  };

  // Export PDF
  const handleExportPDF = () => {
    const filtered = filterBoissons();
    const doc = new jsPDF();
    doc.text("Cost Boissons", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [["Nom", "Type", "Contenance", "Coût/portion", "Prix vente", "Food cost (%)"]],
      body: filtered.map(b => [
        b.nom,
        b.type || b.famille || "",
        b.unite || "",
        b.cout_portion ? Number(b.cout_portion).toFixed(2) : "-",
        b.prix_vente ? Number(b.prix_vente).toFixed(2) : "-",
        b.prix_vente && b.cout_portion
          ? ((b.cout_portion / b.prix_vente) * 100).toFixed(1)
          : "-"
      ]),
      styles: { fontSize: 9 }
    });
    doc.save("Boissons.pdf");
    toast.success("Export PDF généré !");
  };

  // Stats, filtrage & top ventes
  const filterBoissons = () =>
    boissons.filter(
      b =>
        b.nom?.toLowerCase().includes(search.toLowerCase()) ||
        b.famille?.toLowerCase().includes(search.toLowerCase()) ||
        b.type?.toLowerCase().includes(search.toLowerCase())
    );
  const filtered = filterBoissons();

  const ventesParBoisson = {};
  ventes.forEach(v => {
    ventesParBoisson[v.boisson_id] = (ventesParBoisson[v.boisson_id] || 0) + v.quantite;
  });
  const filteredWithVentes = filtered.map(b => ({
    ...b,
    quantiteVendue: ventesParBoisson[b.id] || 0
  }));
  const sortedByVentes = [...filteredWithVentes].sort((a, b) => b.quantiteVendue - a.quantiteVendue);

  // Stats globales
  const foodCosts = filteredWithVentes
    .filter(b => b.prix_vente && b.cout_portion)
    .map(b => (b.cout_portion / b.prix_vente) * 100);
  const avgFC = foodCosts.length
    ? foodCosts.reduce((a, b) => a + b, 0) / foodCosts.length
    : 0;

  // Données pour graphique (top ventes)
  const chartData = sortedByVentes
    .slice(0, 10)
    .map(b => ({
      nom: b.nom,
      Ventes: b.quantiteVendue,
      "Marge (€)": b.prix_vente && b.cout_portion ? (b.prix_vente - b.cout_portion).toFixed(2) : 0
    }));

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Cost Boissons</h1>
      {/* Recherche, période, export */}
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <input
          className="input input-bordered w-64"
          placeholder="Recherche (nom/type/contenance)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div>
          <label className="mr-2">Début</label>
          <input
            type="date"
            className="input input-bordered"
            value={periode.debut}
            onChange={e => setPeriode(p => ({ ...p, debut: e.target.value }))}
          />
        </div>
        <div>
          <label className="mr-2">Fin</label>
          <input
            type="date"
            className="input input-bordered"
            value={periode.fin}
            onChange={e => setPeriode(p => ({ ...p, fin: e.target.value }))}
          />
        </div>
        <Button onClick={handleExportExcel}>Exporter Excel</Button>
        <Button onClick={handleExportPDF}>Exporter PDF</Button>
      </div>
      {/* Stats avancées */}
      <div className="bg-white shadow rounded-xl p-4 mb-6 flex flex-wrap gap-6">
        <div>
          <span className="font-semibold text-blue-700">Food cost moyen&nbsp;:</span>
          <span className={avgFC > FOOD_COST_SEUIL ? "text-red-600 font-bold" : "font-bold"}>
            {foodCosts.length ? avgFC.toFixed(1) + " %" : "-"}
          </span>
        </div>
        <div>
          <span className="font-semibold">Top vente (période)&nbsp;: </span>
          {sortedByVentes[0]?.nom ? (
            <>
              <span className="font-bold">{sortedByVentes[0].nom}</span>{" "}
              <span className="text-gray-500">
                ({sortedByVentes[0].quantiteVendue} ventes)
              </span>
            </>
          ) : "-"}
        </div>
        <div>
          <span className="font-semibold">Total boissons actives&nbsp;: </span>
          {filtered.length}
        </div>
      </div>
      {/* Graphique top ventes */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="font-bold mb-2">Top 10 ventes boissons (période)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="nom" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Ventes" fill="#1e88e5" />
            <Bar dataKey="Marge (€)" fill="#e0a800" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Tableau interactif */}
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Type</th>
              <th className="px-2 py-1">Contenance</th>
              <th className="px-2 py-1">Coût/portion (€)</th>
              <th className="px-2 py-1">Prix vente (€)</th>
              <th className="px-2 py-1">Food cost (%)</th>
              <th className="px-2 py-1">Ventes</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredWithVentes.map(b => {
                const foodCost =
                  b.prix_vente && b.cout_portion
                    ? ((b.cout_portion / b.prix_vente) * 100).toFixed(1)
                    : null;
                return (
                <_motion.tr
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className="px-2 py-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-blue-700 p-0 h-auto min-w-0 underline">
                            {b.nom}
                          </Button>
                        </DialogTrigger>
                        <DialogContent
                          className="bg-white rounded-xl shadow-lg p-6 max-w-md"
                          style={{ zIndex: 1000 }}
                        >
                          <h2 className="font-bold text-xl mb-2">{b.nom}</h2>
                          <p>
                            <b>Type&nbsp;:</b> {b.type || b.famille || "-"}
                            <br />
                            <b>Contenance&nbsp;:</b> {b.unite || "-"}
                            <br />
                            <b>Coût/portion&nbsp;:</b>{" "}
                            {b.cout_portion ? Number(b.cout_portion).toFixed(2) : "-"} €
                            <br />
                            <b>Prix vente&nbsp;:</b>{" "}
                            {b.prix_vente ? Number(b.prix_vente).toFixed(2) : "-"} €
                            <br />
                            <b>Food cost&nbsp;:</b>{" "}
                            {foodCost ? (
                              <span className={foodCost > FOOD_COST_SEUIL ? "text-red-600 font-semibold" : ""}>
                                {foodCost} %
                              </span>
                            ) : (
                              "-"
                            )}
                            <br />
                            <b>Ventes sur période sélectionnée&nbsp;: </b>
                            {b.quantiteVendue}
                          </p>
                        </DialogContent>
                      </Dialog>
                    </td>
                    <td className="px-2 py-1">{b.type || b.famille || "-"}</td>
                    <td className="px-2 py-1">{b.unite || "-"}</td>
                    <td className="px-2 py-1">{b.cout_portion ? Number(b.cout_portion).toFixed(2) : "-"}</td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="input input-bordered w-20"
                        value={b.prix_vente ?? ""}
                        disabled={savingId === b.id}
                        onChange={e =>
                          handleChangePV(b, e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    </td>
                    <td className={"px-2 py-1 font-semibold " + (foodCost > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                      {foodCost ?? "-"}
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          className="input input-bordered w-16"
                          placeholder="Ventes"
                          value={ventesInput[b.id] ?? ""}
                          onChange={e => handleVentesInput(b.id, e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveVente(b.id)}
                          variant="secondary"
                        >
                          +
                        </Button>
                        <span className="ml-2 text-blue-600">{b.quantiteVendue}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="text-sm">Voir fiche</Button>
                        </DialogTrigger>
                        <DialogContent
                          className="bg-white rounded-xl shadow-lg p-6 max-w-md"
                          style={{ zIndex: 1000 }}
                        >
                          <h2 className="font-bold text-xl mb-2">{b.nom}</h2>
                          <p>
                            <b>Détails techniques :</b>
                            <br />
                            ID : {b.id}
                            <br />
                            Dernière mise à jour : {b.updated_at || "-"}
                          </p>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </_motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
