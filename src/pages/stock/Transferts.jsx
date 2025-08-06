// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { useTransferts } from "@/hooks/useTransferts";
import { Button } from "@/components/ui/button";
import ListingContainer from "@/components/ui/ListingContainer";
import TableHeader from "@/components/ui/TableHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TransfertForm from "./TransfertForm";

export default function Transferts() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { transferts, fetchTransferts } = useTransferts();
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (periode.debut && periode.fin)
      fetchTransferts({ debut: periode.debut, fin: periode.fin });
  }, [periode, fetchTransferts]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!isAuthenticated) return null;

  return (
    <div className="p-6 space-y-4">
      <TableHeader className="items-end gap-4">
        <div>
          <label>Début</label>
          <input
            type="date"
            className="form-input"
            value={periode.debut}
            onChange={(e) =>
              setPeriode((p) => ({ ...p, debut: e.target.value }))
            }
          />
        </div>
        <div>
          <label>Fin</label>
          <input
            type="date"
            className="form-input"
            value={periode.fin}
            onChange={(e) => setPeriode((p) => ({ ...p, fin: e.target.value }))}
          />
        </div>
        <Button onClick={() => setShowForm(true)}>Nouveau transfert</Button>
      </TableHeader>
      <ListingContainer>
        <table className="text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit</th>
              <th>Zone source</th>
              <th>Zone destination</th>
              <th className="text-right">Quantité</th>
            </tr>
          </thead>
          <tbody>
            {transferts.map((t) => (
              <tr key={t.transfert_id}>
                <td>{t.date_transfert}</td>
                <td>{t.produit || ""}</td>
                <td>{t.zone_source || ""}</td>
                <td>{t.zone_dest || ""}</td>
                <td className="text-right">{t.quantite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListingContainer>
      {showForm && (
        <TransfertForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            if (periode.debut && periode.fin)
              fetchTransferts({ debut: periode.debut, fin: periode.fin });
          }}
        />
      )}
    </div>
  );
}
