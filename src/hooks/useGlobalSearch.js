// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useGlobalSearch() {
  const { mama_id } = useAuth();
  const [results, setResults] = useState([]);

  async function search(q) {
    if (!q || !mama_id) {
      setResults([]);
      return [];
    }

    const [{ data: produits }, { data: fiches }] = await Promise.all([
      supabase
        .from('produits')
        .select('id, nom')
        .eq('mama_id', mama_id)
        .ilike('nom', `%${q}%`),
      supabase
        .from('fiches')
        .select('id, nom:titre')
        .eq('mama_id', mama_id)
        .ilike('titre', `%${q}%`),
    ]);

    const produitsList = Array.isArray(produits) ? produits : [];
    const fichesList = Array.isArray(fiches) ? fiches : [];

    const merged = [
      ...produitsList.map((p) => ({ type: 'produit', id: p.id, nom: p.nom })),
      ...fichesList.map((f) => ({ type: 'fiche', id: f.id, nom: f.nom })),
    ].slice(0, 2);

    setResults(merged);
    return merged;
  }

  return { results, search };
}

