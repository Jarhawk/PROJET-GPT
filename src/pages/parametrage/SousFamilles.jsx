// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import ListingContainer from '@/components/ui/ListingContainer';
import PaginationFooter from '@/components/ui/PaginationFooter';
import TableHeader from '@/components/ui/TableHeader';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';

const PAGE_SIZE = 50;

export default function SousFamilles() {
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('parametrage', 'peut_modifier');
  const [sousFamilles, setSousFamilles] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchSousFamilles();
    }
  }, [authLoading, mama_id, page, search]);

  async function fetchSousFamilles() {
    setLoading(true);
    let query = supabase
      .from('sous_familles')
      .select('id, nom, famille_id, familles(nom)', { count: 'exact' })
      .eq('mama_id', mama_id)
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .order('nom', { ascending: true });
    if (search) query = query.ilike('nom', `%${search}%`);
    const { data, error, count } = await query;
    if (error) {
      toast.error(error.message);
      setSousFamilles([]);
      setTotal(0);
    } else {
      setSousFamilles(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    setLoading(true);
    const { error } = await supabase
      .from('sous_familles')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Erreur suppression :', error);
      toast.error('Suppression échouée.');
    } else {
      toast.success('Élément supprimé !');
    }
    await fetchSousFamilles();
    setLoading(false);
  }

  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  if (authLoading || loading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Sous-familles</h1>
      <TableHeader className="gap-2">
        <input
          className="input flex-1"
          placeholder="Recherche"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </TableHeader>
      <ListingContainer className="w-full overflow-x-auto">
        <table className="text-sm w-full">
          <thead>
            <tr>
              <th className="px-2 py-1 w-full">Nom</th>
              <th className="px-2 py-1 w-full">Famille</th>
              <th className="px-2 py-1 w-full">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sousFamilles.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-2">
                  Aucune sous-famille
                </td>
              </tr>
            ) : (
              sousFamilles.map((sf) => (
                <tr key={sf.id}>
                  <td className="px-2 py-1">{sf.nom}</td>
                  <td className="px-2 py-1">{sf.familles?.nom || ''}</td>
                  <td className="px-2 py-1 flex justify-center">
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => {
                        if (confirm('Supprimer cet élément ?')) {
                          handleDelete(sf.id);
                        }
                      }}
                    >
                      🗑 Supprimer
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ListingContainer>
      <PaginationFooter page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}
