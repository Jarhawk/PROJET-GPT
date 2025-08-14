// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const MultiMamaContext = createContext();

export function MultiMamaProvider({ children }) {
  const { isSuperadmin, mama_id: authMamaId } = useAuth();
  const [mamas, setMamas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mamaActif, setMamaActifState] = useState(
    localStorage.getItem('mamaActif') || authMamaId
  );

  useEffect(() => {
    if (authMamaId && !mamaActif) {
      setMamaActifState(authMamaId);
    }
  }, [authMamaId]);

  useEffect(() => {
    if (authMamaId || isSuperadmin) fetchMamas();
  }, [authMamaId, isSuperadmin]);

  async function fetchMamas() {
    setLoading(true);
    let data = [];
    try {
      if (isSuperadmin) {
        const { data: rows, error } = await supabase
          .from('mamas')
          .select('id, nom')
          .order('nom');
        if (error) throw error;
        data = rows || [];
      } else if (authMamaId) {
        const { data: row, error } = await supabase
          .from('mamas')
          .select('id, nom')
          .eq('id', authMamaId)
          .maybeSingle();
        if (error) throw error;
        data = row ? [row] : [];
      }
    } catch (err) {
      toast.error(err.message || 'Erreur chargement établissements');
    }
    setMamas(Array.isArray(data) ? data : []);
    if (!mamaActif && Array.isArray(data) && data.length > 0) {
      changeMama(data[0].id);
    }
    setLoading(false);
  }

  const changeMama = (id) => {
    setMamaActifState(id);
    localStorage.setItem('mamaActif', id);
  };

  const value = { mamas, mamaActif, setMamaActif: changeMama, loading };

  if (loading && mamas.length === 0) {
    return <LoadingSpinner message="Chargement établissements..." />;
  }

  return (
    <MultiMamaContext.Provider value={value}>
      {children}
    </MultiMamaContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMultiMama() {
  return useContext(MultiMamaContext) || {};
}
