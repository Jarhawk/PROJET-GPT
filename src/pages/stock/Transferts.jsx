// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { useTransferts } from "@/hooks/useTransferts";
import { useZones } from "@/hooks/useZones";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TransfertForm from "./TransfertForm";

export default function Transferts() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { transferts, fetchTransferts } = useTransferts();
  const { zones, fetchZones } = useZones();
  const { products, fetchProducts } = useProducts();
  const [filters, setFilters] = useState({
    debut: "",
    fin: "",
    zone_source_id: "",
    zone_destination_id: "",
    produit_id: "",
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchZones();
    fetchProducts({});
  }, [fetchZones, fetchProducts]);

  useEffect(() => {
    fetchTransferts(filters);
  }, [filters, fetchTransferts]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!isAuthenticated) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto text-shadow">
      <h1 className="text-2xl font-bold mb-4">Transferts</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <input
          type="date"
          aria-label="Début"
          className="form-input"
          value={filters.debut}
          onChange={(e) => setFilters((f) => ({ ...f, debut: e.target.value }))}
        />
        <input
          type="date"
          aria-label="Fin"
          className="form-input"
          value={filters.fin}
          onChange={(e) => setFilters((f) => ({ ...f, fin: e.target.value }))}
        />
        <select
          aria-label="Zone source"
          className="form-input"
          value={filters.zone_source_id}
          onChange={(e) =>
            setFilters((f) => ({ ...f, zone_source_id: e.target.value }))
          }
        >
          <option value="">Zone source</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nom}
            </option>
          ))}
        </select>
        <select
          aria-label="Zone destination"
          className="form-input"
          value={filters.zone_destination_id}
          onChange={(e) =>
            setFilters((f) => ({ ...f, zone_destination_id: e.target.value }))
          }
        >
          <option value="">Zone destination</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nom}
            </option>
          ))}
        </select>
        <select
          aria-label="Produit"
          className="form-input"
          value={filters.produit_id}
          onChange={(e) =>
            setFilters((f) => ({ ...f, produit_id: e.target.value }))
          }
        >
          <option value="">Produit</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
        <Button onClick={() => setShowForm(true)}>Nouveau transfert</Button>
      </div>
      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Zone source</th>
              <th className="p-2">Zone destination</th>
              <th className="p-2">Nb produits</th>
              <th className="p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {transferts.map((t) => (
              <tr key={t.id}>
                <td className="p-2">{t.date_transfert?.slice(0, 10)}</td>
                <td className="p-2">{t.zone_source?.nom || ""}</td>
                <td className="p-2">{t.zone_destination?.nom || ""}</td>
                <td className="p-2">{t.lignes?.length || 0}</td>
                <td className="p-2">{t.statut || "enregistré"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      {showForm && (
        <TransfertForm
          onClose={() => setShowForm(false)}
          onSaved={() => fetchTransferts(filters)}
        />
      )}
    </div>
  );
}

