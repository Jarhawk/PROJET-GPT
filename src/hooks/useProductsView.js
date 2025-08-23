import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useProductsView() {
  const { mama_id: currentMamaId } = useAuth();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async ({
    term = '',
    page = 1,
    limit = 25,
    sortBy = 'nom',
    ascending = true,
    filtreActif = 'tous',
  } = {}) => {
    if (!currentMamaId) return;
    setLoading(true);
    let query = supabase
      .from('produits_view')
      .select('id, nom, unite, pmp, stock_theorique, zone, actif', { count: 'exact' })
      .eq('mama_id', currentMamaId);
    if (term) query = query.ilike('nom', `%${term}%`);
    if (filtreActif !== 'tous') query = query.eq('actif', filtreActif);
    query = query
      .order(sortBy, { ascending })
      .range((page - 1) * limit, page * limit - 1);
    const { data, error, count } = await query;
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const mapped = (data || []).map((p) => ({
      ...p,
      unite: p.unite ? { nom: p.unite } : null,
      zone_stock: p.zone ? { nom: p.zone } : null,
    }));
    setProducts(mapped);
    setTotal(count || 0);
    setLoading(false);
  }, [currentMamaId]);

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
