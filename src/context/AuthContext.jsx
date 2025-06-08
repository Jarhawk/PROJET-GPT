// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Contexte global Auth
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);             // Session Supabase
  const [user, setUser] = useState(null);                   // Objet user (email, id, etc.)
  const [claims, setClaims] = useState(null);               // { role, mama_id, access_rights }
  const [loading, setLoading] = useState(true);             // Chargement initial/refresh

  // Récupérer les claims personnalisés depuis la table "users"
  const fetchClaims = useCallback(async (userId) => {
    if (!userId) return setClaims(null);

    const { data, error } = await supabase
      .from("users")
      .select("role, mama_id, access_rights")
      .eq("id", userId)
      .single();

    if (error) {
      setClaims(null);
      console.error("Erreur récupération claims:", error);
    } else {
      setClaims(data);
    }
  }, []);

  // Initialisation / listener session Supabase
  useEffect(() => {
    setLoading(true);

    // Check session à l'ouverture
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) fetchClaims(session.user.id);
      setLoading(false);
    });

    // Listener sur les changements d'état auth
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        setLoading(true);
        await fetchClaims(session.user.id);
        setLoading(false);
      } else {
        setClaims(null);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, [fetchClaims]);

  // Déconnexion utilisateur
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setClaims(null);
    window.location.href = "/login";
  };

  // Exporte le contexte
  const value = {
    session,
    user,
    claims,             // { role, mama_id, access_rights }
    loading,
    authReady: !loading,
    logout,
    isAuthenticated: !!user && !!claims,
    // helpers (facultatif)
    isAdmin: claims?.role === "admin" || claims?.role === "superadmin",
    mama_id: claims?.mama_id || null,
    access_rights: claims?.access_rights || [],
    role: claims?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook d'accès au contexte Auth
export function useAuth() {
  return useContext(AuthContext);
}
