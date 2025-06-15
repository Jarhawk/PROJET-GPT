import { useEffect, useState } from "react";
import { useFournisseurTotals } from "@/hooks/useFournisseurTotals";
import { Toaster } from "react-hot-toast";

export default function StatsFournisseurs() {
  const { fetchTotals } = useFournisseurTotals();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchTotals().then(setRows);
  }, [fetchTotals]);

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Achats par fournisseur</h1>
      <table className="min-w-full text-xs bg-white rounded-xl shadow-md">
        <thead>
          <tr>
            <th className="px-2 py-1">Fournisseur</th>
            <th className="px-2 py-1">Nb factures</th>
            <th className="px-2 py-1">Total achats €</th>
            <th className="px-2 py-1">Dernière facture</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.fournisseur_id}>
              <td className="px-2 py-1">{r.nom}</td>
              <td className="px-2 py-1 text-right">{r.nb_factures}</td>
              <td className="px-2 py-1 text-right">{Number(r.total_achats).toLocaleString()}</td>
              <td className="px-2 py-1">{r.last_invoice_date || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
