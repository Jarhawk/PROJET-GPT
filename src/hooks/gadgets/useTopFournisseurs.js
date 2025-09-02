import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useMamaSettings } from '@/hooks/useMamaSettings';

export default function useTopFournisseurs() {
  const { mamaId } = useMamaSettings();
  const [topFournisseurs, setTopFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopFournisseurs = async () => {
      if (!mamaId) return [];
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('v_top_fournisseurs')
          .select('fournisseur_id, montant:montant_total, nombre_achats, mama_id')
          .eq('mama_id', mamaId)
          .order('montant_total', { ascending: false })
          .limit(5);
        if (error) throw error;
        const rows = Array.isArray(data) ? data : [];

        // Récupération des noms fournisseurs séparément
        const ids = rows.map((r) => r.fournisseur_id).filter(Boolean);
        let fournisseursById = {};
        if (ids.length) {
          const { data: fData, error: fErr } = await supabase
            .from('fournisseurs')
            .select('id, nom')
            .eq('mama_id', mamaId)
            .in('id', ids);
          if (!fErr && Array.isArray(fData)) {
            for (const f of fData) fournisseursById[f.id] = f.nom;
          }
        }

        const enriched = rows.map((r) => ({
          ...r,
          nom: fournisseursById[r.fournisseur_id] || '',
        }));
        setTopFournisseurs(enriched);
      } catch (e) {
        setError(e);
        setTopFournisseurs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopFournisseurs();
  }, [mamaId]);

  return { data: topFournisseurs, loading, error };
}

