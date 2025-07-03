// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import TableContainer from "@/components/ui/TableContainer";
import { motion as Motion, AnimatePresence } from "framer-motion";

const FOOD_COST_SEUIL = 28;
const PERIODES = [
  { label: "Semaine", value: "week" },
  { label: "Mois", value: "month" },
  { label: "Année", value: "year" },
  { label: "Personnalisée", value: "custom" },
];

export default function BarManager() {
  const { mama_id, loading: authLoading } = useAuth();
  const [ventes, setVentes] = useState([]);
  const [boissons, setBoissons] = useState([]);
  const [periode, setPeriode] = useState("week");
  const [dates, setDates] = useState({ debut: "", fin: "" });
  const [search, setSearch] = useState("");

  // Initialisation dates par défaut (semaine en cours)
  useEffect(() => {
    const today = new Date();
    let debut, fin;
    if (periode === "week") {
      const d = new Date(today);
      d.setDate(today.getDate() - today.getDay());
      debut = d.toISOString().slice(0, 10);
      fin = today.toISOString().slice(0, 10);
    } else if (periode === "month") {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      debut = d.toISOString().slice(0, 10);
      fin = today.toISOString().slice(0, 10);
    } else if (periode === "year") {
      const d = new Date(today.getFullYear(), 0, 1);
      debut = d.toISOString().slice(0, 10);
      fin = today.toISOString().slice(0, 10);
    }
    if (periode !== "custom") setDates({ debut, fin });
  }, [periode]);

  // Charger boissons actives
  useEffect(() => {
    if (!mama_id) return;
    supabase
      .from("fiches_techniques")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("actif", true)
      .ilike("famille", "%boisson%")
      .then(({ data }) => setBoissons(data || []));
  }, [mama_id]);

  // Charger stats ventes boissons sur période
  useEffect(() => {
    if (!mama_id || !dates.debut || !dates.fin) return;
    supabase
      .from("ventes_boissons")
      .select("boisson_id, quantite, date_vente")
      .eq("mama_id", mama_id)
      .gte("date_vente", dates.debut)
      .lte("date_vente", dates.fin)
      .then(({ data }) => setVentes(data || []));
  }, [mama_id, dates]);

  // Map boissons et ventes
  const ventesAgg = {};
  ventes.forEach(v => {
    ventesAgg[v.boisson_id] = (ventesAgg[v.boisson_id] || 0) + v.quantite;
  });
  const boissonsStats = boissons
    .map(b => ({
      ...b,
      quantiteVendue: ventesAgg[b.id] || 0,
      margeUnitaire: b.prix_vente && b.cout_portion ? b.prix_vente - b.cout_portion : 0,
      foodCost: b.prix_vente && b.cout_portion ? (b.cout_portion / b.prix_vente) * 100 : null,
      totalMarge: (ventesAgg[b.id] || 0) * (b.prix_vente && b.cout_portion ? b.prix_vente - b.cout_portion : 0),
      totalCA: (ventesAgg[b.id] || 0) * (b.prix_vente || 0),
    }))
    .filter(b =>
      b.nom?.toLowerCase().includes(search.toLowerCase()) ||
      b.famille?.toLowerCase().includes(search.toLowerCase()) ||
      b.type?.toLowerCase().includes(search.toLowerCase())
    );
  // Classement top ventes
  const topVentes = [...boissonsStats].sort((a, b) => b.quantiteVendue - a.quantiteVendue).slice(0, 10);
  // Classement top marges
  const topMarge = [...boissonsStats].sort((a, b) => b.totalMarge - a.totalMarge).slice(0, 10);

  // Stat globales
  const ventesTot = boissonsStats.reduce((a, b) => a + b.quantiteVendue, 0);
  const caTot = boissonsStats.reduce((a, b) => a + b.totalCA, 0);
  const margeTot = boissonsStats.reduce((a, b) => a + b.totalMarge, 0);
  const avgFC =
    boissonsStats.filter(b => b.foodCost !== null).reduce((a, b) => a + b.foodCost, 0) /
    (boissonsStats.filter(b => b.foodCost !== null).length || 1);

  // Export Excel/PDF
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      boissonsStats.map(b => ({
        Nom: b.nom,
        Type: b.type || b.famille || "",
        "Coût/portion (€)": b.cout_portion ? Number(b.cout_portion).toFixed(2) : "",
        "Prix vente (€)": b.prix_vente ? Number(b.prix_vente).toFixed(2) : "",
        "Food cost (%)": b.foodCost ? b.foodCost.toFixed(1) : "",
        "Ventes": b.quantiteVendue,
        "Marge unitaire (€)": b.margeUnitaire ? b.margeUnitaire.toFixed(2) : "",
        "Marge totale (€)": b.totalMarge ? b.totalMarge.toFixed(2) : "",
        "Chiffre d'affaires (€)": b.totalCA ? b.totalCA.toFixed(2) : "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BarManager");
    XLSX.writeFile(wb, "BarManager.xlsx");
    toast.success("Export Excel généré !");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Statistiques Bar Manager", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [["Nom", "Type", "Coût/portion", "PV", "FC (%)", "Ventes", "Marge €", "CA €"]],
      body: boissonsStats.map(b => [
        b.nom,
        b.type || b.famille || "",
        b.cout_portion ? Number(b.cout_portion).toFixed(2) : "-",
        b.prix_vente ? Number(b.prix_vente).toFixed(2) : "-",
        b.foodCost ? b.foodCost.toFixed(1) : "-",
        b.quantiteVendue,
        b.margeUnitaire ? b.margeUnitaire.toFixed(2) : "-",
        b.totalCA ? b.totalCA.toFixed(2) : "-",
      ]),
      styles: { fontSize: 9 }
    });
    doc.save("BarManager.pdf");
    toast.success("Export PDF généré !");
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Bar Manager — Analyses avancées</h1>
      {/* Période, recherche, export */}
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <Select
          value={periode}
          onChange={e => setPeriode(e.target.value)}
          className="w-32"
        >
          {PERIODES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </Select>
        <input
          type="date"
          className="input"
          value={dates.debut}
          onChange={e => setDates(d => ({ ...d, debut: e.target.value }))}
          disabled={periode !== "custom"}
        />
        <input
          type="date"
          className="input"
          value={dates.fin}
          onChange={e => setDates(d => ({ ...d, fin: e.target.value }))}
          disabled={periode !== "custom"}
        />
        <input
          className="input w-64"
          placeholder="Recherche (nom/type/contenance)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={handleExportExcel}>Export Excel</Button>
        <Button onClick={handleExportPDF}>Export PDF</Button>
      </div>
      {/* Stat globales */}
      <div className="bg-glass backdrop-blur border border-borderGlass rounded-xl shadow p-4 mb-6 flex flex-wrap gap-6">
        <div>
          <span className="font-semibold text-blue-700">Ventes totales :</span>
          <span className="font-bold"> {ventesTot} </span>
        </div>
        <div>
          <span className="font-semibold text-blue-700">Chiffre d'affaires :</span>
          <span className="font-bold"> {caTot.toFixed(2)} €</span>
        </div>
        <div>
          <span className="font-semibold">Marge totale :</span>
          <span className="font-bold"> {margeTot.toFixed(2)} €</span>
        </div>
        <div>
          <span className="font-semibold">Food cost moyen :</span>
          <span className={avgFC > FOOD_COST_SEUIL ? "text-red-600 font-bold" : "font-bold"}>
            {avgFC ? avgFC.toFixed(1) + " %" : "-"}
          </span>
        </div>
        <div>
          <span className="font-semibold">Boissons référencées :</span> {boissonsStats.length}
        </div>
      </div>
      {/* Graphe top ventes */}
      <div className="bg-glass backdrop-blur border border-borderGlass rounded-xl shadow p-4 mb-6">
        <h2 className="font-bold mb-2">Top 10 ventes (période sélectionnée)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topVentes}>
            <XAxis dataKey="nom" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="quantiteVendue" fill="#1e88e5" name="Ventes" />
            <Bar dataKey="totalMarge" fill="#e0a800" name="Marge (€)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Graphe top marges */}
      <div className="bg-glass backdrop-blur border border-borderGlass rounded-xl shadow p-4 mb-6">
        <h2 className="font-bold mb-2">Top 10 marges boissons</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topMarge}>
            <XAxis dataKey="nom" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalMarge" fill="#e0a800" name="Marge (€)" />
            <Bar dataKey="quantiteVendue" fill="#1e88e5" name="Ventes" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Tableau interactif */}
      <TableContainer className="mt-4">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Type</th>
              <th className="px-2 py-1">Coût/portion</th>
              <th className="px-2 py-1">PV</th>
              <th className="px-2 py-1">FC (%)</th>
              <th className="px-2 py-1">Ventes</th>
              <th className="px-2 py-1">Marge €</th>
              <th className="px-2 py-1">CA €</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {boissonsStats.map(b => (
                <Motion.tr
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <td className="border px-2 py-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="text-blue-700 p-0 h-auto min-w-0 underline">
                          {b.nom}
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="bg-glass backdrop-blur-lg border border-borderGlass rounded-xl shadow-lg p-6 max-w-md z-[1000]"
                      >
                        <h2 className="font-bold text-xl mb-2">{b.nom}</h2>
                        <p>
                          <b>Type :</b> {b.type || b.famille || "-"}
                          <br />
                          <b>Coût/portion :</b>{" "}
                          {b.cout_portion ? Number(b.cout_portion).toFixed(2) : "-"} €
                          <br />
                          <b>Prix vente :</b>{" "}
                          {b.prix_vente ? Number(b.prix_vente).toFixed(2) : "-"} €
                          <br />
                          <b>Food cost :</b>{" "}
                          {b.foodCost ? (
                            <span className={b.foodCost > FOOD_COST_SEUIL ? "text-red-600 font-semibold" : ""}>
                              {b.foodCost.toFixed(1)} %
                            </span>
                          ) : (
                            "-"
                          )}
                          <br />
                          <b>Ventes sur période sélectionnée : </b>
                          {b.quantiteVendue}
                          <br />
                          <b>Marge totale : </b>
                          {b.totalMarge ? b.totalMarge.toFixed(2) : "-"} €
                          <br />
                          <b>Chiffre d'affaires : </b>
                          {b.totalCA ? b.totalCA.toFixed(2) : "-"} €
                        </p>
                      </DialogContent>
                    </Dialog>
                  </td>
                  <td className="px-2 py-1">{b.type || b.famille || "-"}</td>
                  <td className="px-2 py-1">{b.cout_portion ? Number(b.cout_portion).toFixed(2) : "-"}</td>
                  <td className="px-2 py-1">{b.prix_vente ? Number(b.prix_vente).toFixed(2) : "-"}</td>
                  <td className={"border px-2 py-1 font-semibold " + (b.foodCost > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                    {b.foodCost ? b.foodCost.toFixed(1) : "-"}
                  </td>
                  <td className="border px-2 py-1">{b.quantiteVendue}</td>
                  <td className="border px-2 py-1">{b.totalMarge ? b.totalMarge.toFixed(2) : "-"}</td>
                  <td className="border px-2 py-1">{b.totalCA ? b.totalCA.toFixed(2) : "-"}</td>
                </Motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
