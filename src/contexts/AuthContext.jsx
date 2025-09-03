import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

const AuthCtx = createContext(null);

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [access_rights, setAccessRights] = useState(null);
  const [rightsLoading, setRightsLoading] = useState(true);
  const navigate = useNavigate(); // OK car AuthProvider est SOUS BrowserRouter (cf App.jsx)

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) navigate('/login');
    });
    return () => sub.data.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    let on = true;
    (async () => {
      setRightsLoading(true);
      try {
        if (!session) { setAccessRights(null); return; }
        // TODO: charge tes droits depuis ta table/vue dédiée
        const rights = await fetchRightsForUser(session.user.id);
        if (on) setAccessRights(rights);
      } finally {
        if (on) setRightsLoading(false);
      }
    })();
    return () => { on = false; };
  }, [session]);

  const value = useMemo(() => ({
    session,
    access_rights,
    rightsLoading,
  }), [session, access_rights, rightsLoading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function fetchRightsForUser(/* userId */) {
  // Implémente selon ton schéma; retourne un objet { rightKey: true/false }
  // Par défaut, tout autorisé pour éviter les flashs pendant l’intégration
  return {};
}
