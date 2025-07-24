// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import GlassCard from '@/components/ui/GlassCard';
import { LiquidBackground } from '@/components/LiquidBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { buildPriceData } from '@/components/produits/priceHelpers';

export default function ProduitDetailPage() {
  const { id } = useParams();
  const { fetchProductPrices } = useProducts();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchProductPrices(id).then((h) => {
        setHistory(h || []);
        setLoading(false);
      });
    }
  }, [id, fetchProductPrices]);

  const chartData = buildPriceData(history);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10 w-full max-w-3xl">
        <h1 className="text-xl font-bold mb-4">Historique des prix</h1>
        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner message="Chargement..." />
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fournisseur</th>
                <th>Prix (€)</th>
                <th>Dernière livraison</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center">Aucune donnée</td>
                </tr>
              ) : (
                history.map((h, i) => (
                  <tr key={i}>
                    <td>{h.created_at?.slice(0, 10) || '-'}</td>
                    <td>{h.fournisseur?.nom || '-'} </td> // ✅ Correction Codex
                    <td>{h.prix_achat ?? '-'}</td>
                    <td>{h.derniere_livraison?.slice(0, 10) || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        {chartData.length > 0 && (
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                {Object.keys(chartData[0]).filter((k) => k !== 'date').map((key) => (
                  <Line key={key} type="monotone" dataKey={key} stroke="#bfa14d" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
