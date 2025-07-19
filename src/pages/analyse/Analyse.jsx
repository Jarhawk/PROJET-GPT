// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useAnalyse } from "@/hooks/useAnalyse";
import { useProduitsAutocomplete } from "@/hooks/useProduitsAutocomplete";
import GlassCard from "@/components/ui/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Analyse() {
  const { isAuthenticated, loading: authLoading, access_rights } = useAuth();
  const { getMonthlyPurchases, getEvolutionAchats } = useAnalyse();
  const { results, searchProduits } = useProduitsAutocomplete();
  const [filters, setFilters] = useState({ produit_id: "", debut: "", fin: "" });
  const [monthly, setMonthly] = useState([]);
  const [evolution, setEvolution] = useState([]);

  useEffect(() => { searchProduits(); }, [searchProduits]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    getMonthlyPurchases({ debut: filters.debut, fin: filters.fin }).then(setMonthly);
    if (filters.produit_id) {
      getEvolutionAchats({ produit_id: filters.produit_id, debut: filters.debut, fin: filters.fin }).then(setEvolution);
    } else {
      setEvolution([]);
    }
  }, [isAuthenticated, authLoading, filters, getMonthlyPurchases, getEvolutionAchats]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!access_rights?.analyse?.peut_voir) return <Navigate to="/unauthorized" replace />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analyse avancée</h1>
      <div className="flex flex-wrap gap-2">
        <input type="month" className="input" value={filters.debut} onChange={e => setFilters(f => ({ ...f, debut: e.target.value }))} />
        <input type="month" className="input" value={filters.fin} onChange={e => setFilters(f => ({ ...f, fin: e.target.value }))} />
        <select className="input" value={filters.produit_id} onChange={e => setFilters(f => ({ ...f, produit_id: e.target.value }))}>
          <option value="">Tous produits</option>
          {results.map(p => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>
      </div>
      <GlassCard>
        <h2 className="font-semibold mb-2">Achats mensuels</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthly}>
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#bfa14d" />
          </LineChart>
        </ResponsiveContainer>
        <table className="table-auto mt-4 text-sm w-full">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Mois</th>
              <th className="px-2 py-1 text-right">Total €</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map(row => (
              <tr key={row.mois}>
                <td className="px-2 py-1">{row.mois}</td>
                <td className="px-2 py-1 text-right">{Number(row.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
      {evolution.length > 0 && (
        <GlassCard>
          <h2 className="font-semibold mb-2">Évolution des achats du produit</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={evolution}>
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="montant" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      )}
    </div>
  );
}
