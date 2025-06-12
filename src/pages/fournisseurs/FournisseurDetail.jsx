// src/pages/FournisseurDetail.jsx
import { useState, useEffect } from "react";
import { useFournisseurStats } from "@/hooks/useFournisseurStats";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { useInvoices } from "@/hooks/useInvoices";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";

export default function FournisseurDetail({ id }) {
  const { fetchStatsForFournisseur } = useFournisseurStats();
  const { getProductsBySupplier } = useSupplierProducts();
  const { fetchInvoicesBySupplier } = useInvoices();
  const [stats, setStats] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchStatsForFournisseur(id).then(setStats),
      fetchInvoicesBySupplier(id).then(setInvoices),
    ]).then(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // Top produits du fournisseur
    const ps = getProductsBySupplier(id) || [];
    setTopProducts(ps.map(p => ({
      nom: p.product_nom,
      total: p.total_achat,
    })).sort((a, b) => b.total - a.total).slice(0, 8));
  }, [id]);

  if (loading) return <div>Chargement…</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-mamastockGold mb-2">Détail fournisseur</h2>
      {/* Stats d’achats/factures */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-2">Évolution achats mensuels</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={stats}>
              <XAxis dataKey="mois" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_achats" stroke="#bfa14d" name="Total Achats" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-2">Top produits achetés</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={topProducts}>
              <XAxis dataKey="nom" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#0f1c2e" name="Quantité achetée" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Factures liées */}
      <div className="glass-table mt-4 p-2">
        <h3 className="font-semibold mb-2">Factures associées</h3>
        <table className="w-full table-auto text-xs">
          <thead>
            <tr>
              <th>Date</th>
              <th>N° Facture</th>
              <th>Montant</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(f => (
              <tr key={f.id}>
                <td>{f.date_facture}</td>
                <td>{f.numero_facture}</td>
                <td>{f.montant_total.toFixed(2)} €</td>
                <td>{f.statut}</td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/factures/${f.id}`)}>
                    Voir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .glass-card, .glass-table {
          background: rgba(255,255,255,0.33);
          backdrop-filter: blur(13px);
          border-radius: 16px;
        }
      `}</style>
    </div>
  );
}
