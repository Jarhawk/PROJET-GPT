// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useAuth from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function SousFamilleList({ famille }) {
  const { mama_id } = useAuth();
  const [sousFamilles, setSousFamilles] = useState([]);
  const [nom, setNom] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (famille?.id) fetchSousFamilles();
  }, [famille?.id, mama_id]);

  async function fetchSousFamilles() {
    const { data, error } = await supabase
      .from('sous_familles')
      .select('id, nom')
      .eq('mama_id', mama_id)
      .eq('famille_id', famille.id)
      .order('nom', { ascending: true });
    if (error) toast.error(error.message);
    else setSousFamilles(data || []);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!nom.trim()) return;
    const { error } = await supabase
      .from('sous_familles')
      .insert([{ nom: nom.trim(), famille_id: famille.id, mama_id }]);
    if (error) toast.error(error.message);
    else {
      toast.success('Sous-famille ajoutée');
      setNom('');
      await fetchSousFamilles();
    }
  }

  async function handleUpdate(sf) {
    const { error } = await supabase
      .from('sous_familles')
      .update({ nom: editing.nom })
      .eq('id', sf.id)
      .eq('mama_id', mama_id);
    if (error) toast.error(error.message);
    else {
      toast.success('Sous-famille mise à jour');
      setEditing(null);
      await fetchSousFamilles();
    }
  }

  async function handleDelete(sf) {
    if (!window.confirm('Supprimer cette sous-famille ?')) return;
    const { error } = await supabase
      .from('sous_familles')
      .delete()
      .eq('id', sf.id)
      .eq('mama_id', mama_id);
    if (error) {
      if (error.code === '23503') toast.error('Sous-famille utilisée par des produits.');
      else toast.error(error.message);
    } else {
      toast.success('Sous-famille supprimée');
    }
    await fetchSousFamilles();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Sous-familles de {famille.nom}</h2>
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Nom de la sous-famille"
          className="flex-1"
        />
        <Button type="submit">Ajouter</Button>
      </form>
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {sousFamilles.length === 0 && <li>Aucune sous-famille</li>}
        {sousFamilles.map(sf => (
          <li key={sf.id} className="flex items-center gap-2">
            {editing?.id === sf.id ? (
              <>
                <Input
                  value={editing.nom}
                  onChange={e => setEditing({ ...editing, nom: e.target.value })}
                  className="flex-1"
                />
                <Button size="sm" onClick={() => handleUpdate(sf)}>
                  Enregistrer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1">{sf.nom}</span>
                <Button size="sm" variant="secondary" onClick={() => setEditing(sf)}>
                  Modifier
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => handleDelete(sf)}
                >
                  🗑
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
