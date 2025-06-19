// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Contexte global Auth
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // Session Supabase
  const [userData, setUserData] = useState({
    role: null,
    mama_id: null,
    access_rights: [],
    user_id: null,
  });
  const [loading, setLoading] = useState(true); // Chargement initial/refresh

  async function fetchUserData(session) {
    if (!session?.user) {
      setUserData({ role: null, mama_id: null, access_rights: [], user_id: null });
      return;
    }
    const { data } = await supabase
      .from("users")
      .select("role, mama_id, access_rights")
      .eq("id", session.user.id)
      .single();

    setUserData({
      role: data?.role || null,
      mama_id: data?.mama_id || null,
      access_rights: Array.isArray(data?.access_rights) ? data.access_rights : [],
      user_id: session.user.id,
    });
  }

  // Initialisation / listener session Supabase
  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await fetchUserData(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        await fetchUserData(session);
        setLoading(false);
      } else {
        setUserData({ role: null, mama_id: null, access_rights: [], user_id: null });
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Déconnexion utilisateur
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserData({ role: null, mama_id: null, access_rights: [], user_id: null });
    window.location.href = "/login";
  };

  // Exporte le contexte
  const value = {
    ...userData,
    session,
    loading,
    logout,
    isAuthenticated: !!session,
    isAdmin: userData.role === "admin" || userData.role === "superadmin",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook d'accès au contexte Auth
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext) || {};
}
