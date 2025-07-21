// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useInventaires } from "@/hooks/useInventaires";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";

export default function Inventaire() {
  const { inventaires, getInventaires } = useInventaires();
  const [zoneFilter, setZoneFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showArchives, setShowArchives] = useState(false);

  useEffect(() => {
    getInventaires({ includeArchives: showArchives });
  }, [showArchives]);

  const filtered = inventaires
    .filter(i => !zoneFilter || i.zone === zoneFilter)
    .filter(i => !dateFilter || i.date_inventaire === dateFilter)
    .sort((a, b) => new Date(b.date_inventaire) - new Date(a.date_inventaire));

  const zones = Array.from(new Set(inventaires.map(i => i.zone).filter(Boolean)));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Inventaires</h1>
        <Button asChild>
          <Link to="/inventaire/new">Créer un nouvel inventaire</Link>
        </Button>
      </div>

      <div className="flex gap-4 mb-4 items-center">
        <input
          type="date"
          className="input"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
        <select
          className="input"
          value={zoneFilter}
          onChange={e => setZoneFilter(e.target.value)}
        >
          <option value="">Toutes zones</option>
          {zones.map(z => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showArchives}
            onChange={e => setShowArchives(e.target.checked)}
          />
          Archivés
        </label>
      </div>

      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Zone</th>
              <th className="p-2">Lignes</th>
              <th className="p-2">Valeur totale</th>
              <th className="p-2">Écart</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => {
              const total = (inv.lignes || []).reduce(
                (sum, l) => sum + Number(l.quantite || 0) * Number(l.product?.pmp || 0),
                0
              );
              const ecart = (inv.lignes || []).reduce(
                (sum, l) =>
                  sum + (Number(l.quantite || 0) - Number(l.product?.stock_theorique || 0)) * Number(l.product?.pmp || 0),
                0
              );
              return (
                  <tr key={inv.id} className="border-b last:border-none">
                    <td className="p-2">{inv.date_inventaire}</td>
                  <td className="p-2">{inv.zone || '-'}</td>
                  <td className="p-2">{inv.lignes?.length || 0}</td>
                  <td className="p-2">{total.toFixed(2)} €</td>
                  <td className={`p-2 font-semibold ${ecart < 0 ? 'text-red-600' : ecart > 0 ? 'text-green-600' : ''}`}>{ecart.toFixed(2)} €</td>
                  <td className="p-2">
                    <Link to={`/inventaire/${inv.id}`} className="text-blue-600 underline">Voir</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
