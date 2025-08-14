// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReporting } from '@/hooks/useReporting';
import StatCard from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import GlassCard from '@/components/ui/GlassCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

export default function Reporting() {
  const { mama_id, loading: authLoading } = useAuth();
  const {
    getIndicators,
    getGraphData,
    getEcartInventaire,
    getCostCenterBreakdown,
  } = useReporting();

  const [filters, setFilters] = useState(() => {
    const month = new Date().toISOString().slice(0, 7);
    return {
      date_start: month + '-01',
      date_end: month + '-31',
      fournisseur: '',
      famille: '',
      fiche: '',
      cost_center: '',
    };
  });

  const [indicators, setIndicators] = useState({});
  const [achats, setAchats] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [ecarts, setEcarts] = useState([]);
  const [ccData, setCcData] = useState([]);

  useEffect(() => {
    if (!mama_id) return;
    (async () => {
      setIndicators(await getIndicators(filters));
      setAchats(await getGraphData('achats', filters));
      setFamilles(await getGraphData('familles', filters));
      setEcarts(await getEcartInventaire(filters));
      setCcData(await getCostCenterBreakdown(filters));
    })();
  }, [filters, mama_id]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4 text-mamastock-gold">
        Reporting analytique
      </h1>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="text-xs mr-2">Début</label>
          <input
            type="date"
            className="form-input"
            value={filters.date_start}
            onChange={(e) =>
              setFilters((f) => ({ ...f, date_start: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-xs mr-2">Fin</label>
          <input
            type="date"
            className="form-input"
            value={filters.date_end}
            onChange={(e) =>
              setFilters((f) => ({ ...f, date_end: e.target.value }))
            }
          />
        </div>
        <input
          className="form-input"
          placeholder="Fournisseur"
          value={filters.fournisseur}
          onChange={(e) =>
            setFilters((f) => ({ ...f, fournisseur: e.target.value }))
          }
        />
        <input
          className="form-input"
          placeholder="Famille"
          value={filters.famille}
          onChange={(e) =>
            setFilters((f) => ({ ...f, famille: e.target.value }))
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Coût matière total"
          value={
            indicators.cout_matiere_total
              ? indicators.cout_matiere_total.toLocaleString() + ' €'
              : '-'
          }
        />
        <StatCard
          label="Évolution PMP"
          value={
            indicators.evolution_pmp
              ? indicators.evolution_pmp.toFixed(2) + ' €'
              : '-'
          }
          variation={indicators.pmp_variation}
        />
        <StatCard
          label="Food cost"
          value={
            indicators.food_cost
              ? (indicators.food_cost * 100).toFixed(1) + ' %'
              : '-'
          }
        />
        <StatCard
          label="Écart inventaire"
          value={
            indicators.ecart_inventaire
              ? indicators.ecart_inventaire.toLocaleString() + ' €'
              : '-'
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-4">
          <h2 className="font-semibold mb-2">Achats par mois</h2>
          {achats.length === 0 ? (
            <p className="text-center text-sm">
              Aucune donnée pour la période sélectionnée
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={achats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="achats" fill="#bfa14d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
        <GlassCard className="p-4">
          <h2 className="font-semibold mb-2">Coûts par famille</h2>
          {familles.length === 0 ? (
            <p className="text-center text-sm">
              Aucune donnée pour la période sélectionnée
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={familles}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="famille" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cout" stroke="#d7263d" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-4 mt-6 overflow-auto">
        <h2 className="font-semibold mb-2">Écarts d'inventaire</h2>
        {ecarts.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            Aucune donnée pour la période sélectionnée
          </p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1">Produit</th>
                <th className="px-2 py-1">Écart (€)</th>
              </tr>
            </thead>
            <tbody>
              {ecarts.map((e) => (
                <tr key={e.produit_id} className="odd:bg-black/10">
                  <td className="px-2 py-1">{e.produit}</td>
                  <td className="px-2 py-1">
                    {Number(e.ecart || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {ccData.length > 0 && (
        <GlassCard className="p-4 mt-6">
          <h2 className="font-semibold mb-2">Répartition par cost center</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ccData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="valeur" stroke="#0f1c2e" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      )}
    </div>
  );
}
