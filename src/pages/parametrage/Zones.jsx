// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import TableContainer from '@/components/ui/TableContainer';
import { Button } from '@/components/ui/button';
import { useZones } from '@/hooks/useZones';
import ZoneRow from '@/components/parametrage/ZoneRow';
import ZoneForm from '@/forms/ZoneForm';
import useAuth from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';

export default function Zones() {
  const { zones, total, fetchZones, addZone, updateZone, deleteZone } = useZones();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('zones_stock', 'peut_modifier');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchZones({ search, page });
    }
  }, [fetchZones, search, page, authLoading, mama_id]);

  const handleSave = async values => {
    if (edit?.id) await updateZone(edit.id, values);
    else await addZone(values.nom);
    setEdit(null);
    toast.success('Zone enregistrée');
  };

  const handleDelete = async zone => {
    if (window.confirm('Supprimer cette zone ?')) {
      const res = await deleteZone(zone.id);
      if (!res?.error) toast.success('Zone supprimée');
    }
  };

  const handleToggle = async zone => {
    await updateZone(zone.id, { actif: !zone.actif });
  };

  const pages = Math.ceil(total / 50) || 1;

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Zones de stockage</h1>
      <div className="flex gap-2 mb-4 items-end">
        <input
          className="input flex-1"
          placeholder="Recherche"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={() => setEdit({})}>+ Nouvelle zone</Button>
      </div>
      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Statut</th>
              <th className="px-2 py-1">Créée le</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map(z => (
              <ZoneRow key={z.id} zone={z} onEdit={setEdit} onDelete={handleDelete} onToggle={handleToggle} />
            ))}
            {zones.length === 0 && (
              <tr>
                <td colSpan="4" className="py-2">
                  Aucune zone
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
      <div className="flex justify-between mt-2">
        <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Précédent
        </Button>
        <span>
          Page {page}/{pages}
        </span>
        <Button variant="outline" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}>
          Suivant
        </Button>
      </div>
      {edit && (
        <div className="modal fixed inset-0 flex items-center justify-center bg-black/50" role="dialog">
          <div className="bg-white rounded-lg p-4">
            <ZoneForm
              zone={edit}
              onCancel={() => setEdit(null)}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  );
}
