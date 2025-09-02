import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useTopFournisseurs() {
  const { mama_id } = useAuth();
  const [topFournisseurs, setTopFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopFournisseurs = async () => {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('v_top_fournisseurs')
          .select(
            'fournisseur_id, montant:montant_total, nombre_achats, mama_id'
          )
          .eq('mama_id', mama_id)
          .order('montant_total', { ascending: false })
          .limit(5);
        if (error) throw error;
        const rows = Array.isArray(data) ? data : [];

        let fournisseursById = {};
        if (rows.length) {
          const ids = rows.map(r => r.fournisseur_id);
          const { data: fournisseurs, error: errF } = await supabase
            .from('fournisseurs')
            .select('id, nom')
            .eq('mama_id', mama_id)
            .in('id', ids);
          if (errF) throw errF;
          fournisseursById = (Array.isArray(fournisseurs)
            ? fournisseurs
            : []
          ).reduce((acc, f) => {
            acc[f.id] = f.nom;
            return acc;
          }, {});
        }

        const merged = rows.map(r => ({
          ...r,
          nom: fournisseursById[r.fournisseur_id] || '',
        }));
        setTopFournisseurs(merged);
      } catch (e) {
        setError(e);
        setTopFournisseurs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopFournisseurs();
  }, [mama_id]);

  return { data: topFournisseurs, loading, error };
}

