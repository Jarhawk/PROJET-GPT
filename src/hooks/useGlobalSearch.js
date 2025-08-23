// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useGlobalSearch() {
  const [results, setResults] = useState([]);

  async function search(q) {
    if (!q) {
      setResults([]);
      return [];
    }

    const [{ data: produits }, { data: fiches }] = await Promise.all([
      supabase.from('produits').select('id, nom').ilike('nom', `%${q}%`),
      supabase.from('fiches').select('id, nom').ilike('nom', `%${q}%`),
    ]);

    const merged = [
      ...(produits || []).map(p => ({ type: 'produit', id: p.id, nom: p.nom })),
      ...(fiches || []).map(f => ({ type: 'fiche', id: f.id, nom: f.nom })),
    ].slice(0, 2);

    setResults(merged);
    return merged;
  }

  return { results, search };
}

