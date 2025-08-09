// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AlertesRupture() {
  const { fetchAlerts, markAsHandled, generateSuggestions } = useAlerts();
  const [items, setItems] = useState([]);
  const [type, setType] = useState("");
  const [traite, setTraite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAlerts(type || null, traite)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [fetchAlerts, type, traite]);

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Alertes de stock</h1>
      <div className="flex gap-2 mb-4 items-center">
        <select
          className="form-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Toutes</option>
          <option value="rupture">Rupture</option>
          <option value="prevision">Prévision</option>
        </select>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={traite}
            onChange={(e) => setTraite(e.target.checked)}
          />
          Traitées
        </label>
        <Button
          onClick={async () => {
            const sugg = await generateSuggestions();
            console.log("Suggestions", sugg);
          }}
        >
          Générer commande fournisseur
        </Button>
      </div>
      <table className="text-sm w-full">
        <thead>
          <tr>
            <th className="p-2 text-left">Produit</th>
            <th className="p-2 text-right">Actuel</th>
            <th className="p-2 text-right">Min</th>
            <th className="p-2 text-right">Projeté</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td className="p-2">{a.produit?.nom}</td>
              <td className="p-2 text-right">{a.stock_actuel}</td>
              <td className="p-2 text-right">{a.stock_min}</td>
              <td className="p-2 text-right">{a.stock_projete}</td>
              <td className="p-2">
                {!a.traite && (
                  <Button size="xs" onClick={() => markAsHandled(a.id)}>
                    Traiter
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
