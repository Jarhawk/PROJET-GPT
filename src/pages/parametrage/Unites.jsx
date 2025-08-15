// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import ListingContainer from '@/components/ui/ListingContainer';
import PaginationFooter from '@/components/ui/PaginationFooter';
import TableHeader from '@/components/ui/TableHeader';
import { Button } from '@/components/ui/button';
import { useUnites } from '@/hooks/useUnites';
import UniteRow from '@/components/parametrage/UniteRow';
import UniteForm from '@/forms/UniteForm';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';
import supabase from '@/lib/supabaseClient';

export default function Unites() {
  const { unites, total, fetchUnites, addUnite, updateUnite } = useUnites();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('parametrage', 'peut_modifier');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchUnites({ search, page, limit: 50 });
    }
  }, [fetchUnites, search, page, authLoading, mama_id]);

  const handleSave = async values => {
    if (edit?.id) await updateUnite(edit.id, values);
    else await addUnite(values.nom);
    setEdit(null);
    toast.success('Unité enregistrée');
    fetchUnites({ search, page, limit: 50 });
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('unites').delete().eq('id', id);
    if (error) {
      console.error('Erreur suppression :', error);
      toast.error('Suppression échouée.');
    } else {
      toast.success('Élément supprimé !');
      fetchUnites({ search, page, limit: 50 });
    }
  };

  const handleToggle = async unite => {
    const { error } = await supabase
      .from('unites')
      .update({ actif: !unite.actif })
      .eq('id', unite.id);
    if (error) toast.error('Erreur modification');
    else {
      toast.success('Statut mis à jour');
      fetchUnites({ search, page, limit: 50 });
    }
  };

  const pages = Math.ceil(total / 50) || 1;

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Unités de produits</h1>
      <TableHeader className="gap-2">
        <input
          className="input flex-1"
          placeholder="Recherche"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={() => setEdit({})}>+ Nouvelle unité</Button>
      </TableHeader>
      <ListingContainer className="w-full overflow-x-auto">
        <table className="text-sm w-full">
          <thead>
            <tr>
              <th className="px-2 py-1 w-full">Nom</th>
              <th className="px-2 py-1 w-full">Statut</th>
              <th className="px-2 py-1 w-full">Actions</th>
            </tr>
          </thead>
          <tbody>
            {unites.map(u => (
              <UniteRow
                key={u.id}
                unite={u}
                onEdit={setEdit}
                onDelete={(unite) => {
                  if (confirm('Supprimer cet élément ?')) {
                    handleDelete(unite.id);
                  }
                }}
                onToggle={handleToggle}
              />
            ))}
            {unites.length === 0 && (
              <tr>
                <td colSpan="3" className="py-2">
                  Aucune unité
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ListingContainer>
      <PaginationFooter page={page} pages={pages} onPageChange={setPage} />
      {edit && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEdit(null)} />
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 w-full max-w-md">
            <UniteForm
              unite={edit}
              onCancel={() => setEdit(null)}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  );
}
