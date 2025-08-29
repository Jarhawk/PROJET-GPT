// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useGlobalSearch() {
  const [results, setResults] = useState([]);
  const { mama_id } = useAuth();

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
        .from('fiches_techniques')
        .select('id, nom')
        .eq('mama_id', mama_id)
        .ilike('nom', `%${q}%`),
    ]);

    const prodList = [];
    if (Array.isArray(produits)) {
      for (const p of produits) {
        prodList.push({ type: 'produit', id: p.id, nom: p.nom });
      }
    }
    const ficheList = [];
    if (Array.isArray(fiches)) {
      for (const f of fiches) {
        ficheList.push({ type: 'fiche', id: f.id, nom: f.nom });
      }
    }
    const merged = prodList.concat(ficheList).slice(0, 2);
    setResults(merged);
    return merged;
  }

  return { results, search };
}

