// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabaseClient';
import useAuth from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import SousFamilleForm from './SousFamilleForm';
import SousFamilleRow from './SousFamilleRow';

export default function SousFamilleList({ famille }) {
  const { mama_id } = useAuth();
  const [sousFamilles, setSousFamilles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (famille?.id && mama_id) fetchSousFamilles();
  }, [famille?.id, mama_id]);

  async function fetchSousFamilles() {
    if (!mama_id || !famille?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('sous_familles')
      .select('*')
      .eq('mama_id', mama_id)
      .eq('famille_id', famille.id)
      .order('nom', { ascending: true });
    if (error) {
      toast.error(error.message);
      setSousFamilles([]);
    } else {
      setSousFamilles(data || []);
    }
    setLoading(false);
  }

  async function handleCreate(values) {
    if (!mama_id) return toast.error('Action non autorisée');
    const { error } = await supabase
      .from('sous_familles')
      .insert([{ ...values, famille_id: famille.id, mama_id }]);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Sous-famille ajoutée');
      setAdding(false);
      await fetchSousFamilles();
    }
  }

  async function handleUpdate(id, values) {
    if (!mama_id) return toast.error('Action non autorisée');
    const { error } = await supabase
      .from('sous_familles')
      .update(values)
      .match({ id, mama_id });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Sous-famille mise à jour');
      await fetchSousFamilles();
    }
  }

  async function handleDelete(sf) {
    if (!mama_id) return toast.error('Action non autorisée');
    if (!window.confirm('Supprimer cette sous-famille ?')) return;
    const { error } = await supabase
      .from('sous_familles')
      .delete()
      .match({ id: sf.id, mama_id });
    if (error) {
      if (error.code === '23503') toast.error('Sous-famille utilisée par des produits.');
      else toast.error(error.message);
    } else {
      toast.success('Sous-famille supprimée');
    }
    await fetchSousFamilles();
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sous-familles de {famille?.nom}</h2>
        {!adding && (
          <Button onClick={() => setAdding(true)}>Nouvelle sous-famille</Button>
        )}
      </CardHeader>
      <CardContent>
        {adding && (
          <SousFamilleForm
            onSubmit={handleCreate}
            onCancel={() => setAdding(false)}
          />
        )}
        {loading ? (
          <LoadingSpinner message="Chargement..." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Nom</th>
                  <th className="px-2 py-1 text-center">Actif</th>
                  <th className="px-2 py-1 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sousFamilles.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-2 text-center">
                      Aucune sous-famille
                    </td>
                  </tr>
                )}
                {sousFamilles.map(sf => (
                  <SousFamilleRow
                    key={sf.id}
                    sousFamille={sf}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
