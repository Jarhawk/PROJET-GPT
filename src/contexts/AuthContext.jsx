import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCtx = createContext({ user: null, rights: null, loading: true });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, rights: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;

        if (!user) {
          setState({ user: null, rights: [], loading: false });
          return;
        }

        // charger le profil/rights
        const { data: profile } = await supabase
          .from('utilisateurs')
          .select('access_rights,mama_id')
          .eq('auth_id', user.id)
          .single();

        const rights = profile?.access_rights ?? [];
        setState({ user, rights, loading: false });
      } catch (_e) {
        setState({ user: null, rights: [], loading: false });
      }
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState(s => ({ ...s, user: session?.user ?? null }));
    });
    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
