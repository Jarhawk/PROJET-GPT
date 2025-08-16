// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabaseClient';

function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export function useProduitsSearch(term, { enabled = true } = {}) {
  const { mama_id } = useAuth();
  const debounced = useDebounced(term, 250);

  return useQuery({
    queryKey: ['produits-search', mama_id, debounced],
    enabled:
      enabled && Boolean(mama_id) && (debounced || '').trim().length >= 1,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      if (!mama_id || !(debounced || '').trim()) return [];
      const q = debounced.trim();
      const { data, error } = await supabase
        .from('produits')
        .select(
          'id, nom, code, shortcode, tva, dernier_prix, unite_id, unite:unite_id (nom)'
        )
        .eq('mama_id', mama_id)
        .eq('actif', true)
        .or(
          `nom.ilike.%${q}%,code.ilike.%${q}%,shortcode.ilike.%${q}%`
        )
        .order('nom', { ascending: true })
        .limit(50);

      if (error || !Array.isArray(data)) return [];

      const results = data.map((p) => ({
        id: p.id,
        nom: p.nom,
        code: p.code || '',
        shortcode: p.shortcode || '',
        tva: p.tva ?? 0,
        dernier_prix: p.dernier_prix ?? 0,
        unite_id: p.unite_id || '',
        unite: p.unite?.nom || '',
      }));

      return results.length > 0
        ? results
        : [{ id: '', nom: 'Pas de résultat' }];
    },
  });
}

export default useProduitsSearch;
