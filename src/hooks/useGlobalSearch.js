// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useGlobalSearch() {
  const { mama_id } = useAuth();
  const [results, setResults] = useState([]);

  const search = useCallback(async term => {
    if (!term) return setResults([]);
    const [prod, fournisseurs] = await Promise.all([
      supabase
        .from('produits')
        .select('id, nom')
        .ilike('nom', `%${term}%`)
        .eq('mama_id', mama_id)
        .limit(5),
      supabase
        .from('fournisseurs')
        .select('id, nom')
        .ilike('nom', `%${term}%`)
        .eq('mama_id', mama_id)
        .limit(5),
    ]);
    setResults([
      ...(prod.data || []).map(p => ({ type: 'Produit', id: p.id, nom: p.nom })),
      ...(fournisseurs.data || []).map(f => ({ type: 'Fournisseur', id: f.id, nom: f.nom })),
    ]);
  }, [mama_id]);

  return { results, search };
}
