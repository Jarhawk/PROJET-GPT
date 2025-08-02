// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProduitFormModal from '@/components/produits/ProduitFormModal';
import GlassCard from '@/components/ui/GlassCard';
import { LiquidBackground } from '@/components/LiquidBackground';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { buildPriceData } from '@/components/produits/priceHelpers';

export default function ProduitDetailPage() {
  const { id } = useParams();
  const { fetchProductPrices, getProduct, toggleProductActive } = useProducts();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState("");
  const [product, setProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    if (id) {
      getProduct(id).then((p) => {
        if (!active) return;
        setProduct(p);
        setProductName(p?.nom || "");
        document.title = p?.nom
          ? `Historique produit - ${p.nom}`
          : "Historique produit";
      });
    } else {
      document.title = "Historique produit";
    }
    return () => {
      active = false;
    };
  }, [id, getProduct]);

  useEffect(() => {
    let active = true;
    if (id) {
      setLoading(true);
      fetchProductPrices(id).then((h) => {
        if (!active) return;
        setHistory(h || []);
        setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [id, fetchProductPrices]);

  const chartData = buildPriceData(history);

  const handleToggle = async () => {
    if (product) {
      await toggleProductActive(product.id, !product.actif);
      const updated = await getProduct(product.id);
      setProduct(updated);
    }
  };

  const summary = Object.values(
    history.reduce((acc, h) => {
      const idF = h.fournisseur?.id || "";
      if (!acc[idF]) {
        acc[idF] = {
          nom: h.fournisseur?.nom || "Inconnu",
          count: 0,
          total: 0,
          lastPrice: null,
          lastDate: null,
        };
      }
      const cur = acc[idF];
      cur.count += 1;
      if (typeof h.prix_achat === "number") {
        cur.total += Number(h.prix_achat);
      }
      if (!cur.lastDate || new Date(h.created_at) > new Date(cur.lastDate)) {
        cur.lastDate = h.created_at;
        cur.lastPrice = h.prix_achat;
      }
      return acc;
    }, {})
  ).map((s) => ({
    ...s,
    prix_moyen: s.count ? s.total / s.count : null,
  }));

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">
            Détails produit {productName && `- ${productName}`}
          </h1>
          <div className="flex gap-2">
            <button className="btn" onClick={() => setShowForm(true)}>
              Éditer
            </button>
            {product && (
              <button className="btn btn-secondary" onClick={handleToggle}>
                {product.actif ? "Désactiver" : "Réactiver"}
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner message="Chargement..." />
          </div>
        ) : (
          <>
            {product && (
              <div className="mb-4 text-sm">
                <p>Fournisseur : {product.main_fournisseur?.nom || '-'}</p>
                <p>Stock minimum : {product.seuil_min ?? '-'}</p>
              </div>
            )}
            <table className="min-w-full text-sm mb-6">
              <thead>
                <tr>
                  <th>Fournisseur</th>
                  <th>Nb achats</th>
                  <th>Prix moyen (€)</th>
                  <th>Dernier prix (€)</th>
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center">Aucune donnée</td>
                  </tr>
                ) : (
                  summary.map((s, i) => (
                    <tr key={i}>
                      <td>{s.nom}</td>
                      <td>{s.count}</td>
                      <td>{s.prix_moyen ? s.prix_moyen.toFixed(2) : '-'}</td>
                      <td>{s.lastPrice != null ? s.lastPrice.toFixed(2) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                      <td>{h.fournisseur?.nom || '-'}</td>
                      <td>{h.prix_achat ?? '-'}</td>
                      <td>{h.derniere_livraison?.slice(0, 10) || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
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
      <ProduitFormModal
        open={showForm}
        produit={product}
        onClose={() => setShowForm(false)}
        onSuccess={async () => {
          const updated = await getProduct(product.id);
          setProduct(updated);
          setProductName(updated?.nom || "");
        }}
      />
    </div>
  );
}
