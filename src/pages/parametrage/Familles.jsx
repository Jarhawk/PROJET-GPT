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
import useAuth from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';
import { supabase } from '@/lib/supabase';

export default function Familles() {
  const {
    familles,
    total,
    fetchFamilles,
    addFamille,
    updateFamille,
    loading,
  } = useFamilles();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('parametrage', 'peut_modifier');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchFamilles({ search, page, limit: 50 });
    }
  }, [fetchFamilles, search, page, authLoading, mama_id]);

  const handleSave = async (values) => {
    setActionLoading(true);
    if (edit?.id) await updateFamille(edit.id, values);
    else await addFamille(values);
    await fetchFamilles({ search, page, limit: 50 });
    setEdit(null);
    toast.success('Famille enregistrée');
    setActionLoading(false);
  };

  const handleDelete = async (famille) => {
    if (!window.confirm('Supprimer cette famille ?')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('familles')
        .delete()
        .eq('id', famille.id)
        .eq('mama_id', mama_id);
      if (error) {
        if (error.code === '23503') {
          toast.error('Cette famille est utilisée par des produits.');
        } else {
          toast.error(error.message || 'Erreur lors de la suppression.');
        }
        console.error(error);
      } else {
        toast.success('Famille supprimée.');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression.');
      console.error(err);
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
    <div className="p-6 max-w-2xl mx-auto">
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
      <ListingContainer>
        <table className="text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Statut</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const map = {};
              familles.forEach((f) => (map[f.id] = { ...f, children: [] }));
              Object.values(map).forEach((f) => {
                if (f.famille_parent_id && map[f.famille_parent_id]) {
                  map[f.famille_parent_id].children.push(f);
                }
              });
              const roots = Object.values(map).filter(
                (f) => !f.famille_parent_id,
              );
              if (roots.length === 0) {
                return (
                  <tr>
                    <td colSpan="3" className="py-2">
                      Aucune famille
                    </td>
                  </tr>
                );
              }
              return roots
                .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
                .map((r) => (
                  <FamilleRow
                    key={r.id}
                    famille={r}
                    level={0}
                    onEdit={setEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onAddSub={(f) => setEdit({ famille_parent_id: f.id })}
                  />
                ));
            })()}
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
              familles={familles}
              onCancel={() => setEdit(null)}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  );
}
