// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useInventaires } from "@/hooks/useInventaires";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from '@/hooks/useAuth';

export default function Inventaire() {
  const { inventaires, getInventaires } = useInventaires();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess("inventaires", "peut_modifier");
  const [zoneFilter, setZoneFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [showArchives, setShowArchives] = useState(false);

  useEffect(() => {
    if (!authLoading && mama_id) {
      getInventaires({ includeArchives: showArchives });
    }
  }, [showArchives, mama_id, authLoading, getInventaires]);

  if (authLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  const filtered = inventaires
    .filter(i => !zoneFilter || i.zone === zoneFilter)
    .filter(i => !dateFilter || i.date_inventaire === dateFilter)
    .filter(i => !statutFilter || i.statut === statutFilter)
    .sort((a, b) => new Date(b.date_inventaire) - new Date(a.date_inventaire));

  const zones = Array.from(new Set(inventaires.map(i => i.zone).filter(Boolean)));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Inventaires</h1>
        {canEdit && (
          <Button asChild>
            <Link to="/inventaire/new">Créer un nouvel inventaire</Link>
          </Button>
        )}
      </div>

      <div className="flex gap-4 mb-4 items-center">
        <input
          type="date"
          className="form-input"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
        <select
          className="form-input"
          value={zoneFilter}
          onChange={e => setZoneFilter(e.target.value)}
        >
          <option value="">Toutes zones</option>
          {zones.map(z => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
        <select
          className="form-input"
          value={statutFilter}
          onChange={e => setStatutFilter(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="valide">Validé</option>
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
                (sum, l) => sum + Number(l.quantite_reelle || 0) * Number(l.product?.pmp || 0),
                0
              );
              const ecart = (inv.lignes || []).reduce(
                (sum, l) =>
                  sum + (Number(l.quantite_reelle || 0) - Number(l.product?.stock_theorique || 0)) * Number(l.product?.pmp || 0),
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4">
                  Aucun inventaire
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
