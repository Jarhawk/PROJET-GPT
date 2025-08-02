// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import ListingContainer from '@/components/ui/ListingContainer';
import PaginationFooter from '@/components/ui/PaginationFooter';
import TableHeader from '@/components/ui/TableHeader';
import { Button } from '@/components/ui/button';
import { useFamilles } from '@/hooks/useFamilles';
import FamilleRow from '@/components/parametrage/FamilleRow';
import FamilleForm from '@/forms/FamilleForm';
import SousFamilleModal from '@/components/parametrage/SousFamilleModal';
import useAuth from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';

export default function Familles() {
  const {
    familles,
    total,
    fetchFamilles,
    addFamille,
    updateFamille,
    deleteFamille,
    loading,
  } = useFamilles();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('parametrage', 'peut_modifier');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);
  const [subFamille, setSubFamille] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchFamilles({ search, page, limit: 50 });
    }
  }, [fetchFamilles, search, page, authLoading, mama_id]);

  const handleSave = async (values) => {
    setActionLoading(true);
    try {
      if (edit?.id) await updateFamille(edit.id, values);
      else await addFamille(values);
      await fetchFamilles({ search, page, limit: 50 });
      setEdit(null);
      toast.success('Famille enregistrée');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (famille) => {
    if (!window.confirm('Supprimer cette famille ?')) return;
    setActionLoading(true);
    try {
      const { error } = await deleteFamille(famille.id, mama_id);
      if (error) {
        if (error.code === '23503') {
          toast.error('Cette famille est utilisée par des produits.');
        } else {
          toast.error(error.message || 'Erreur lors de la suppression.');
        }
      } else {
        toast.success('Famille supprimée.');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression.');
    } finally {
      await fetchFamilles({ search, page, limit: 50 });
      setActionLoading(false);
    }
  };

  const handleToggle = async (famille) => {
    setActionLoading(true);
    await updateFamille(famille.id, {
      actif: !famille.actif,
      nom: famille.nom,
    });
    await fetchFamilles({ search, page, limit: 50 });
    setActionLoading(false);
  };

  const pages = Math.ceil(total / 50) || 1;

  if (authLoading || loading || actionLoading)
    return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  return (
    <div className="p-6 mx-auto max-w-5xl">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Familles de produits</h1>
      <TableHeader className="gap-2">
        <input
          className="input flex-1"
          placeholder="Recherche"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={() => setEdit({})}>+ Nouvelle famille</Button>
      </TableHeader>
      <ListingContainer className="min-w-[1000px]">
        <table className="text-sm w-full">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Statut</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {familles.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-2">
                  Aucune famille
                </td>
              </tr>
            ) : (
              familles.map((f) => (
                <FamilleRow
                  key={f.id}
                  famille={f}
                  onEdit={setEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onAddSub={() => setSubFamille(f)}
                />
              ))
            )}
          </tbody>
        </table>
      </ListingContainer>
        <PaginationFooter page={page} pages={pages} onPageChange={setPage} />
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
        {subFamille && (
          <SousFamilleModal famille={subFamille} onClose={() => setSubFamille(null)} />
        )}
      </div>
    );
  }
