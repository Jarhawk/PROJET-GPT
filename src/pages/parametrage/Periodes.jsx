// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import ListingContainer from '@/components/ui/ListingContainer';
import TableHeader from '@/components/ui/TableHeader';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';
import { useAuth } from '@/hooks/useAuth';
import usePeriodes from '@/hooks/usePeriodes';
import PeriodeForm from '@/forms/PeriodeForm';

export default function Periodes() {
  const { hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('parametrage', 'peut_modifier');
  const {
    periodes,
    loading,
    fetchPeriodes,
    createPeriode,
    cloturerPeriode,
  } = usePeriodes();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPeriodes();
  }, [fetchPeriodes]);

  const handleCreate = async values => {
    const { error } = await createPeriode(values);
    if (error) toast.error(error.message || 'Erreur lors de la création');
    else {
      toast.success('Période créée');
      setShowForm(false);
    }
  };

  const handleClose = async id => {
    if (!confirm('Clôturer cette période ?')) return;
    const { error } = await cloturerPeriode(id);
    if (error) toast.error(error.message || 'Erreur de clôture');
    else toast.success('Période clôturée');
  };

  if (authLoading || loading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  return (
    <div className="p-6 mx-auto w-full max-w-full">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Périodes comptables</h1>
      <TableHeader className="gap-2">
        <Button onClick={() => setShowForm(true)}>+ Nouvelle période</Button>
      </TableHeader>
      <ListingContainer className="w-full overflow-x-auto">
        <table className="text-sm w-full max-w-full">
          <thead>
            <tr>
              <th className="px-2 py-1">Début</th>
              <th className="px-2 py-1">Fin</th>
              <th className="px-2 py-1">Statut</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {periodes.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-2">
                  Aucune période
                </td>
              </tr>
            ) : (
              periodes.map(p => (
                <tr key={p.id}>
                  <td className="px-2 py-1">{p.debut}</td>
                  <td className="px-2 py-1">{p.fin}</td>
                  <td className="px-2 py-1">
                    {p.actif ? 'En cours' : p.cloturee ? 'Clôturée' : 'Future'}
                  </td>
                  <td className="px-2 py-1">
                    {p.actif && (
                      <Button size="sm" onClick={() => handleClose(p.id)}>
                        Clôturer
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ListingContainer>
      {showForm && <PeriodeForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}
    </div>
  );
}
