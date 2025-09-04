// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { useAuth } from '@/hooks/useAuth';

const HelpContext = createContext();

export function HelpProvider({ children }) {
  const { mama_id, user_id } = useAuth();
  const [tooltips, setTooltips] = useState({});
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTooltips = useCallback(async () => {
    if (!mama_id) return {};
    setLoading(true);
    const { data } = await supabase.
    from('tooltips').
    select('champ, texte').
    eq('mama_id', mama_id);
    setLoading(false);
    const map = {};
    (data || []).forEach((t) => {
      map[t.champ] = t.texte;
    });
    setTooltips(map);
    return map;
  }, [mama_id]);

  const fetchDocs = useCallback(async ({ search = '' } = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    let query = supabase.
    from('documentation').
    select('id, titre, contenu, categorie').
    eq('mama_id', mama_id);
    if (search) query = query.ilike('titre', `%${search}%`);
    const { data } = await query.order('titre', { ascending: true });
    setLoading(false);
    setDocs(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  useEffect(() => {
    if (mama_id) {
      fetchTooltips();
      fetchDocs();
    }
  }, [mama_id, fetchTooltips, fetchDocs]);

  async function markGuideSeen(module) {
    if (!user_id || !mama_id) return;
    await supabase.
    from('guides_seen').
    upsert(
      { user_id, mama_id, module, seen: true },
      { onConflict: 'user_id,module' }
    );
  }

  const value = {
    tooltips,
    docs,
    loading,
    fetchTooltips,
    fetchDocs,
    markGuideSeen
  };

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHelp() {
  return useContext(HelpContext) || {};
}