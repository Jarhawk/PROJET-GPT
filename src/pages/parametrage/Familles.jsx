// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import TableContainer from '@/components/ui/TableContainer';
import { Button } from '@/components/ui/button';
import { useFamilles } from '@/hooks/useFamilles';
import FamilleRow from '@/components/parametrage/FamilleRow';
import FamilleForm from '@/forms/FamilleForm';
import useAuth from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';

export default function Familles() {
  const { familles, total, fetchFamilles, addFamille, updateFamille, batchDeleteFamilles } = useFamilles();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('parametrage', 'peut_modifier');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchFamilles({ search, page, limit: 50 });
    }
  }, [fetchFamilles, search, page, authLoading, mama_id]);

  const handleSave = async values => {
    if (edit?.id) await updateFamille(edit.id, values);
    else await addFamille(values.nom);
    setEdit(null);
    toast.success('Famille enregistrée');
  };

  const handleDelete = async famille => {
    if (window.confirm('Supprimer cette famille ?')) {
      await batchDeleteFamilles([famille.id]);
      toast.success('Famille supprimée');
    }
  };

  const handleToggle = async famille => {
    await updateFamille(famille.id, { actif: !famille.actif, nom: famille.nom });
  };

  const pages = Math.ceil(total / 50) || 1;

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Familles de produits</h1>
      <div className="flex gap-2 mb-4 items-end">
        <input
          className="input flex-1"
          placeholder="Recherche"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={() => setEdit({})}>+ Nouvelle famille</Button>
      </div>
      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Statut</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {familles.map(f => (
              <FamilleRow key={f.id} famille={f} onEdit={setEdit} onDelete={handleDelete} onToggle={handleToggle} />
            ))}
            {familles.length === 0 && (
              <tr>
                <td colSpan="3" className="py-2">
                  Aucune famille
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
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEdit(null)} />
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 w-full max-w-md">
            <FamilleForm
              famille={edit}
              onCancel={() => setEdit(null)}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  );
}
