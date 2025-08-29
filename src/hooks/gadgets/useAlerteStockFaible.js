import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function useAlerteStockFaible() {
  const { mama_id } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    try {
      // Columns: mama_id, produit_id, nom, unite, fournisseur_nom, stock_min, stock_actuel, manque
      const { data: rows, error } = await supabase
        .from('v_alertes_rupture')
        .select(
          'mama_id, produit_id, nom, unite, fournisseur_nom, stock_min, stock_actuel, manque'
        )
        .eq('mama_id', mama_id)
        .order('manque', { ascending: false })
        .limit(50);
      if (error) throw error;

      const arr = Array.isArray(rows) ? rows : [];
      const list = [];
      for (const p of arr) {
        list.push({
          produit_id: p.produit_id,
          nom: p.nom,
          stock_actuel: p.stock_actuel,
          stock_min: p.stock_min,
          unite: p.unite,
          fournisseur_nom: p.fournisseur_nom,
        });
        if (list.length >= 5) break;
      }
      setData(list);
      if (import.meta.env.DEV) {
        console.debug('Chargement dashboard terminé');
      }
      return list;
    } catch (e) {
      console.warn('[gadgets] vue manquante ou colonne absente:', e?.message || e);
      toast.error(e.message || 'Erreur chargement alertes rupture');
      setError(e);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [mama_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
