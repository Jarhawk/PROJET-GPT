import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useProductsView() {
  const { mama_id: currentMamaId } = useAuth();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(
    async ({
      search = '',
      page = 1,
      limit = 25,
      sortBy = 'nom',
      ascending = true,
      statut = 'all',
      familleId = 'all',
      sousFamilleId = 'all',
    } = {}) => {
      if (!currentMamaId) return;
      setLoading(true);
      try {
        let query = supabase
          .from('produits')
          .select(
            `id, nom, actif, pmp, stock_theorique, famille_id, sous_famille_id,
             unite:unites!unite_id(nom),
             zone_stock:zones_stock!zone_stock_id(nom)`,
            { count: 'exact' }
          )
          .eq('mama_id', currentMamaId)
          .eq('unite.mama_id', currentMamaId)
          .eq('zone_stock.mama_id', currentMamaId)
          .order(sortBy, { ascending });

        if (search?.trim()) query = query.ilike('nom', `%${search.trim()}%`);
        if (statut === 'active') query = query.eq('actif', true);
        if (statut === 'inactive') query = query.eq('actif', false);
        if (familleId !== 'all') query = query.eq('famille_id', Number(familleId));
        if (sousFamilleId !== 'all')
          query = query.eq('sous_famille_id', Number(sousFamilleId));

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;
        const rows = Array.isArray(data) ? data : [];
        const mapped = [];
        for (const p of rows) {
          mapped.push({
            ...p,
            unite: p.unite || null,
            zone_stock: p.zone_stock || null,
          });
        }
        setProducts(mapped);
        setTotal(count || 0);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    },
    [currentMamaId]
  );

  const toggleProductActive = useCallback(async (id, actif) => {
    if (!currentMamaId) return;
    const { error } = await supabase
      .from('produits')
      .update({ actif })
      .eq('id', id)
      .eq('mama_id', currentMamaId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(actif ? 'Produit activé' : 'Produit désactivé');
    }
  }, [currentMamaId]);

  return { products, total, loading, fetchProducts, toggleProductActive };
}

export default useProductsView;
