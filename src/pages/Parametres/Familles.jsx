// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ListingContainer from '@/components/ui/ListingContainer';
import TableHeader from '@/components/ui/TableHeader';
import { Button } from '@/components/ui/button';
import FamilleRow from '@/components/parametrage/FamilleRow';
import FamilleForm from '@/forms/FamilleForm';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';
import { useFamillesWithSousFamilles } from '@/hooks/useFamillesWithSousFamilles';
import { supabase } from '@/lib/supabase';

export default function Familles() {
  const {
    familles,
    loading,
    fetchAll,
    addFamille,
    updateFamille,
    addSousFamille,
    updateSousFamille,
    toggleFamille,
    toggleSousFamille,
  } = useFamillesWithSousFamilles();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('parametrage', 'peut_modifier');
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchAll();
    }
  }, [fetchAll, authLoading, mama_id]);

  const handleSave = async (values) => {
    setActionLoading(true);
    const { error } = edit?.id
      ? await updateFamille(edit.id, values)
      : await addFamille(values);
    if (error) toast.error(error.message || 'Erreur lors de la sauvegarde.');
    else {
      toast.success('Famille enregistrée');
      setEdit(null);
    }
    setActionLoading(false);
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('familles')
      .delete()
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (error) {
      console.error('Erreur suppression :', error);
      toast.error('Suppression échouée.');
    } else {
      toast.success('Élément supprimé !');
      fetchAll();
    }
    setActionLoading(false);
  };

  const handleToggle = async (famille) => {
    setActionLoading(true);
    const { error } = await toggleFamille(famille);
    if (error) toast.error(error.message || 'Erreur lors de la mise à jour');
    setActionLoading(false);
  };

  const handleAddSous = async (familleId, data) => {
    const { error } = await addSousFamille(familleId, data);
    if (error) toast.error(error.message || "Erreur lors de l'ajout");
    else toast.success('Sous-famille ajoutée');
  };

  const handleUpdateSous = async (id, data) => {
    const { error } = await updateSousFamille(id, data);
    if (error) toast.error(error.message || 'Erreur lors de la mise à jour');
    else toast.success('Sous-famille mise à jour');
  };

  const handleDeleteSous = async (id) => {
    const { error } = await supabase
      .from('sous_familles')
      .delete()
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (error) {
      console.error('Erreur suppression :', error);
      toast.error('Suppression échouée.');
    } else {
      toast.success('Élément supprimé !');
      fetchAll();
    }
  };

  const handleToggleSous = async (sf) => {
    const { error } = await toggleSousFamille(sf);
    if (error) toast.error(error.message || 'Erreur lors du changement de statut');
  };

  const filtered = familles.filter((f) =>
    f.nom.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading || actionLoading)
    return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  return (
    <div className="p-6 mx-auto w-full max-w-full">
            <h1 className="text-2xl font-bold mb-4">Familles de produits</h1>
      <TableHeader className="gap-2">
        <input
          className="input flex-1"
          placeholder="Recherche"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => setEdit({})}>+ Nouvelle famille</Button>
      </TableHeader>
      <ListingContainer className="w-full overflow-x-auto">
        <table className="text-sm w-full max-w-full">
          <thead>
            <tr>
              <th className="px-2 py-1 w-full">Nom</th>
              <th className="px-2 py-1 w-full">Statut</th>
              <th className="px-2 py-1 w-full">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-2">
                  Aucune famille
                </td>
              </tr>
            ) : (
              filtered.map((f) => (
                <FamilleRow
                  key={f.id}
                  famille={f}
                  onEdit={setEdit}
                  onDelete={(id) => {
                    if (confirm('Supprimer cet élément ?')) {
                      handleDelete(id);
                    }
                  }}
                  onToggle={handleToggle}
                  onAddSousFamille={handleAddSous}
                  onUpdateSousFamille={handleUpdateSous}
                  onDeleteSousFamille={(id) => {
                    if (confirm('Supprimer cet élément ?')) {
                      handleDeleteSous(id);
                    }
                  }}
                  onToggleSousFamille={handleToggleSous}
                />
              ))
            )}
          </tbody>
        </table>
      </ListingContainer>
      {edit && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEdit(null)}
          />
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
