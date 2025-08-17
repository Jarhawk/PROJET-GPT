// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import useFournisseurs from '@/hooks/data/useFournisseurs';

export function useGlobalSearch() {
  const { mama_id } = useAuth();
  const { data: fournisseurs = [] } = useFournisseurs({ actif: true });
  const [results, setResults] = useState([]);

  const search = useCallback(async term => {
    if (!term) return setResults([]);
    const [prod] = await Promise.all([
      supabase
        .from('produits')
        .select('id, nom')
        .ilike('nom', `%${term}%`)
        .eq('mama_id', mama_id)
        .limit(5),
    ]);
    const fournisseursMatches = fournisseurs
      .filter(f => f.nom?.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 5);
    setResults([
      ...(prod.data || []).map(p => ({ type: 'Produit', id: p.id, nom: p.nom })),
      ...fournisseursMatches.map(f => ({ type: 'Fournisseur', id: f.id, nom: f.nom })),
    ]);
  }, [mama_id, fournisseurs]);

  return { results, search };
}
