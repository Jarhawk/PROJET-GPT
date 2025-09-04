// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUnites } from '@/hooks/useUnites';
import ListingContainer from '@/components/ui/ListingContainer';
import TableHeader from '@/components/ui/TableHeader';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';

export default function Unites() {
  const { hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('parametrage', 'peut_modifier');
  const { unites, fetchUnites, addUnite, updateUnite, deleteUnite, loading } = useUnites();
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    fetchUnites();
  }, [fetchUnites]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (edit?.id) await updateUnite(edit.id, { code: edit.code, nom: edit.nom });
      else await addUnite({ code: edit?.code || '', nom: edit?.nom || '' });
      toast.success('Unité enregistrée');
      setEdit(null);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer cet élément ?')) {
      try {
        await deleteUnite(id);
        toast.success('Unité supprimée');
      } catch (err) {
        console.error(err);
        toast.error('Suppression échouée');
      }
    }
  };

  if (authLoading || loading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Unités</h1>
      <TableHeader className="gap-2">
        <Button onClick={() => setEdit({ code: '', nom: '' })}>+ Nouvelle unité</Button>
      </TableHeader>
      <ListingContainer className="w-full overflow-x-auto">
        <table className="text-sm w-full">
          <thead>
            <tr>
              <th className="px-2 py-1">Code</th>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {unites.map((u) => (
              <tr key={u.id}>
                <td className="px-2 py-1">{u.code}</td>
                <td className="px-2 py-1">{u.nom}</td>
                <td className="px-2 py-1 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEdit(u)}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(u.id)}>
                    Supprimer
                  </Button>
                </td>
              </tr>
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
      {edit && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEdit(null)} />
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <input
                className="input"
                placeholder="Code"
                value={edit.code || ''}
                onChange={(e) => setEdit({ ...edit, code: e.target.value })}
              />
              <input
                className="input"
                placeholder="Nom"
                required
                value={edit.nom || ''}
                onChange={(e) => setEdit({ ...edit, nom: e.target.value })}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="outline" onClick={() => setEdit(null)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
