import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { useFicheCoutHistory } from "@/hooks/useFicheCoutHistory";

export default function StatsFiches() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [familles, setFamilles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFiche, setSelectedFiche] = useState(null);

  // Historique coût réel
  const { history, fetchHistory } = useFicheCoutHistory(selectedFiche?.id, claims?.mama_id);

  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated) return;
    setLoading(true);
    Promise.all([
      supabase.from("fiches_techniques").select("*").eq("mama_id", claims.mama_id),
      supabase.from("familles").select("nom").eq("mama_id", claims.mama_id),
    ]).then(([ficheRes, familleRes]) => {
      if (ficheRes.error) setError("Erreur chargement : " + ficheRes.error.message);
      else setFiches(ficheRes.data || []);
      setFamilles((familleRes.data || []).map(f => f.nom));
      setLoading(false);
    });
  }, [claims?.mama_id, isAuthenticated]);

  useEffect(() => {
    if (selectedFiche?.id && claims?.mama_id) fetchHistory();
  }, [selectedFiche?.id, claims?.mama_id, fetchHistory]);

  // Graphiques
  const repartFamille = familles.map(f => ({
    name: f,
    value: fiches.filter(fi => fi.famille === f).length,
  })).filter(f => f.value > 0);

  const fichesSortedByCout = fiches
    .map(f => ({
      nom: f.nom,
      cout: Number(f.cout_total) || 0,
      actif: f.actif,
      id: f.id,
    }))
    .sort((a, b) => b.cout - a.cout)
    .slice(0, 10);

  const repActif = [
    { name: "Actives", value: fiches.filter(f => f.actif).length },
    { name: "Inactives", value: fiches.filter(f => !f.actif).length },
  ];

  // Alertes
  const alertes = [];
  fiches.forEach(f => {
    if (Number(f.cout_total) > 500) alertes.push({ type: "danger", msg: `Fiche "${f.nom}" : coût matière élevé (${Number(f.cout_total).toFixed(2)} €)` });
    if (!f.actif) alertes.push({ type: "warn", msg: `Fiche "${f.nom}" est inactive.` });
    // Ajoute d'autres alertes métier ici
  });

  // Historique coût réel
  const historyChartData = (history || []).map(h => ({
    date: new Date(h.date_cout).toLocaleDateString("fr-FR"),
    cout: Number(h.cout_total),
    cout_portion: Number(h.cout_portion),
  }));

  // Export global
  const handleExportAll = () => {
    const ws = XLSX.utils.json_to_sheet(
      fiches.map(f => ({
        Nom: f.nom,
        Famille: f.famille,
        Actif: f.actif ? "Oui" : "Non",
        "Coût total (€)": Number(f.cout_total).toFixed(2),
        "Coût/portion (€)": Number(f.cout_portion).toFixed(2),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fiches");
    XLSX.writeFile(wb, "Toutes_les_fiches.xlsx");
    toast.success("Export Excel généré !");
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Toaster />
        <span className="text-mamastock-gold animate-pulse">
          Chargement statistiques fiches...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-6">Statistiques fiches techniques</h1>

      <Button variant="outline" onClick={handleExportAll} className="mb-4">
        Exporter toutes les fiches (Excel)
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Répartition par famille */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-lg font-bold mb-2">Répartition par famille</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={repartFamille} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                {repartFamille.map((entry, idx) => (
                  <Cell key={entry.name} fill={["#bfa14d", "#e2ba63", "#d8d1bc", "#f3e6c1", "#f9f6f0", "#eee6d6", "#e1c699", "#8e7649"][idx % 8]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Top coût matière */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-lg font-bold mb-2">Top 10 fiches par coût matière</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fichesSortedByCout}>
              <XAxis dataKey="nom" tickFormatter={n => n.slice(0, 8) + (n.length > 8 ? "…" : "")} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cout" fill="#bfa14d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Actives/inactives */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-lg font-bold mb-2">Fiches actives/inactives</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={repActif} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                {repActif.map((entry, idx) => (
                  <Cell key={entry.name} fill={["#14b85a", "#eb6e34"][idx]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recherche & liste */}
      <div className="mb-4">
        <input
          className="input input-bordered w-72"
          placeholder="Recherche fiche par nom..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="bg-white shadow rounded-xl p-4 mb-8">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Famille</th>
              <th className="px-3 py-2">Actif</th>
              <th className="px-3 py-2">Coût total (€)</th>
              <th className="px-3 py-2">Coût/portion (€)</th>
              <th className="px-3 py-2">Voir historique</th>
            </tr>
          </thead>
          <tbody>
            {fiches
              .filter(f => f.nom.toLowerCase().includes(search.toLowerCase()))
              .map((f) => (
                <tr key={f.id}>
                  <td className="px-3 py-2">{f.nom}</td>
                  <td className="px-3 py-2">{f.famille || "-"}</td>
                  <td className="px-3 py-2">
                    {f.actif
                      ? <span className="text-green-600 font-semibold">Oui</span>
                      : <span className="text-red-600 font-semibold">Non</span>
                    }
                  </td>
                  <td className="px-3 py-2">{f.cout_total ? Number(f.cout_total).toFixed(2) : "-"}</td>
                  <td className="px-3 py-2">{f.cout_portion ? Number(f.cout_portion).toFixed(2) : "-"}</td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline"
                      onClick={() => setSelectedFiche(f)}
                    >
                      Historique coût
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Historique coût réel */}
      {selectedFiche && (
        <div className="bg-white shadow rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-mamastock-gold mb-2">
              Historique coût matière : {selectedFiche.nom}
            </h2>
            <Button variant="ghost" onClick={() => setSelectedFiche(null)}>✕ Fermer</Button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historyChartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cout" name="Coût total (€)" stroke="#bfa14d" />
              <Line type="monotone" dataKey="cout_portion" name="Coût/portion (€)" stroke="#eb6e34" />
            </LineChart>
          </ResponsiveContainer>
          {/* Alerte : hausse brutale */}
          {historyChartData.length > 1 &&
            historyChartData[historyChartData.length - 1].cout > 1.15 * historyChartData[0].cout && (
            <div className="text-red-700 font-semibold mt-2">
              ⚠️ Hausse du coût matière supérieure à 15% sur la période !
            </div>
          )}
        </div>
      )}

      {/* Alertes générales */}
      {alertes.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 p-4 rounded-xl mb-8">
          <h3 className="font-semibold mb-2">Alertes :</h3>
          <ul>
            {alertes.map((a, idx) => (
              <li key={idx} className={a.type === "danger" ? "text-red-700 font-bold" : "text-yellow-700"}>
                {a.msg}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
