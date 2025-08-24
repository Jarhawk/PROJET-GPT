import { useEffect, useState, useCallback } from "react";
import { useRuptureAlerts } from "@/hooks/useRuptureAlerts";
import { Button } from "@/components/ui/button";

export default function AlertesRupture() {
  const { fetchAlerts, generateSuggestions } = useRuptureAlerts();
  const [alerts, setAlerts] = useState([]);

  const load = useCallback(async () => {
    const data = await fetchAlerts();
    setAlerts(data);
  }, [fetchAlerts]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Alertes rupture</h1>
      <div className="flex gap-2 mb-4">
        <Button onClick={() => generateSuggestions()}>Générer commande fournisseur</Button>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr><th>Produit</th><th>Actuel</th><th>Min</th><th>Manque</th></tr>
        </thead>
        <tbody>
          {alerts.map(a => (
            <tr key={a.produit_id || a.id} className="border-t">
              <td className="px-2 py-1">{a.nom}</td>
              <td className="px-2 py-1">{a.stock_actuel}</td>
              <td className="px-2 py-1">{a.stock_min}</td>
              <td className="px-2 py-1">{a.manque}</td>
            </tr>
          ))}
          {alerts.length === 0 && (
            <tr><td colSpan={4} className="text-center p-2">Aucune alerte</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
