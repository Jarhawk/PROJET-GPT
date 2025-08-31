// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useZones } from '@/hooks/useZones';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import Unauthorized from '@/pages/auth/Unauthorized';

export default function Zones() {
  const { fetchZones, updateZone, deleteZone } = useZones();
  const { hasAccess, loading, mama_id } = useAuth();
  const canEdit = hasAccess('zones_stock', 'peut_modifier');
  const [filters, setFilters] = useState({ q: '', type: '', actif: true });
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.resolve(fetchZones(filters)).then((data) =>
      setRows(Array.isArray(data) ? data : [])
    );
  }, [filters, fetchZones]);

  async function handleDelete(id) {
    const { error } = await deleteZone(id);
    if (error) toast.error(error.message);
    else {
      toast.success('Zone supprimée');
      const refreshed = await fetchZones(filters);
      setRows(Array.isArray(refreshed) ? refreshed : []);
    }
  }

  if (loading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  return (
    <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Zones de stock</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <input
          className="input"
          placeholder="Recherche"
          value={filters.q ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          className="input"
          value={filters.type ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">Tous types</option>
          <option value="cave">Cave</option>
          <option value="shop">Shop</option>
          <option value="cuisine">Cuisine</option>
          <option value="bar">Bar</option>
          <option value="entrepot">Entrepôt</option>
          <option value="autre">Autre</option>
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={filters.actif ?? false}
            onChange={(e) =>
              setFilters((f) => ({ ...f, actif: e.target.checked }))
            }
          />
          Actifs uniquement
        </label>
        <Button onClick={() => navigate('/parametrage/zones/new')}>
          + Nouvelle zone
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Nom</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1">Actif</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
            <tbody>
              {(() => {
                const items = [];
                const list = Array.isArray(rows) ? rows : [];
                for (let i = 0; i < list.length; i++) {
                  const z = list[i];
                  items.push(
                    <tr key={z.id} className="border-t border-white/10">
                      <td className="px-2 py-1">{z.nom}</td>
                      <td className="px-2 py-1">{z.type}</td>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={z.actif}
                          onChange={async () => {
                            await updateZone(z.id, { actif: !z.actif });
                            const refreshed = await fetchZones(filters);
                            setRows(Array.isArray(refreshed) ? refreshed : []);
                          }}
                        />
                      </td>
                      <td className="px-2 py-1 flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/parametrage/zones/${z.id}`)}
                        >
                          Éditer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/parametrage/zones/${z.id}/droits`)}
                        >
                          Droits
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(z.id)}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  );
                }
                if (list.length === 0) {
                  items.push(
                    <tr key="empty">
                      <td colSpan="4" className="text-center py-2">
                        Aucune zone
                      </td>
                    </tr>
                  );
                }
                return items;
              })()}
            </tbody>
        </table>
      </div>
    </div>
  );
}
