import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabaseClient";

export const AuthContext = createContext({
  user: null,
  mamaId: null,
  mama_id: null,
  role: null,
  access_rights: {},
  loading: true,
  hasAccess: () => false,
});

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    mamaId: null,
    mama_id: null,
    role: null,
    access_rights: {},
    loading: true,
  });

  const loadSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    let mamaId = null, role = null, access_rights = {};
    if (user) {
      const { data: rows } = await supabase
        .from("utilisateurs")
        .select("mama_id, roles:role_id ( nom ), access_rights")
        .eq("auth_id", user.id)
        .limit(1);
      if (rows?.[0]) {
        mamaId = rows[0].mama_id ?? null;
        role = rows[0].roles?.nom ?? null;
        access_rights = rows[0].access_rights ?? {};
      }
    }

    setState({ user, mamaId, mama_id: mamaId, role, access_rights, loading: false });
  }, []);

  useEffect(() => {
    loadSession();
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadSession());
    return () => sub?.subscription?.unsubscribe?.();
  }, [loadSession]);

  const hasAccess = useCallback((module, action = "read") => {
    const rights = state.access_rights || {};
    if (state.role === "admin") return true;
    const mod = rights[module];
    if (!mod) return false;
    return !!mod[action];
  }, [state.access_rights, state.role]);

  const value = useMemo(() => ({
    ...state,
    mama_id: state.mamaId,
    hasAccess,
  }), [state, hasAccess]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

