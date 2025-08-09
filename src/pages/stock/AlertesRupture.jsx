import { useEffect, useState, useCallback } from "react";
import { useRuptureAlerts } from "@/hooks/useRuptureAlerts";
import { Button } from "@/components/ui/button";

export default function AlertesRupture() {
  const { fetchAlerts, markAsHandled, generateSuggestions } = useRuptureAlerts();
  const [alerts, setAlerts] = useState([]);
  const [type, setType] = useState(null);
  const [traite, setTraite] = useState(null);

  const load = useCallback(async () => {
    const data = await fetchAlerts(type, traite);
    setAlerts(data);
  }, [fetchAlerts, type, traite]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Alertes rupture</h1>
      <div className="flex gap-2 mb-4">
        <Button onClick={() => {setType(null); setTraite(null);}}>Tous</Button>
        <Button onClick={() => setType('rupture')}>Ruptures</Button>
        <Button onClick={() => setType('prevision')}>Prévisions</Button>
        <Button onClick={() => setTraite(false)}>Non traitées</Button>
        <Button onClick={() => setTraite(true)}>Traitées</Button>
        <Button onClick={() => generateSuggestions()}>Générer commande fournisseur</Button>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr><th>Produit</th><th>Actuel</th><th>Proj.</th><th></th></tr>
        </thead>
        <tbody>
          {alerts.map(a => (
            <tr key={a.id} className="border-t">
              <td className="px-2 py-1">{a.produit?.nom}</td>
              <td className="px-2 py-1">{a.stock_actuel}</td>
              <td className="px-2 py-1">{a.stock_projete}</td>
              <td className="px-2 py-1 text-right">
                {!a.traite && (
                  <Button size="sm" onClick={() => markAsHandled(a.id).then(load)}>
                    Traiter
                  </Button>
                )}
              </td>
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
