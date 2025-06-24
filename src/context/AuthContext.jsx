// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { authenticator } from "otplib";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// Contexte global Auth
// Exported separately for hooks like src/hooks/useAuth.js
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // Session Supabase
  const [userData, setUserData] = useState({
    role: null,
    mama_id: null,
    access_rights: [],
    auth_id: null,
    actif: true,
    user_id: null,
  });
  const [loading, setLoading] = useState(true); // Chargement initial/refresh

  async function refreshUser(sessionParam) {
    const current = sessionParam || session;
    if (current) await fetchUserData(current);
  }

  // Login utilisateur avec gestion 2FA
  const login = async ({ email, password, totp }) => {
    let authData;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      authData = data;
    } catch (err) {
      if (err?.message) toast.error(err.message);
      if (err?.status === 500) toast.error("Erreur serveur Supabase (500)");
      return { error: err?.message || "Erreur" };
    }
    const { session: newSession, user } = authData;
    const { data: twoFA } = await supabase
      .from("two_factor_auth")
      .select("secret, enabled")
      .eq("id", user.id)
      .single();

    if (twoFA?.enabled) {
      if (!totp || !authenticator.check(totp, twoFA.secret)) {
        await supabase.auth.signOut();
        return { error: "Code 2FA invalide", twofaRequired: true };
      }
    }

    setSession(newSession);
    await fetchUserData(newSession);
    return { data: newSession };
  };

  async function fetchUserData(session) {
    if (!session?.user) {
      setUserData({
        role: null,
        mama_id: null,
        access_rights: [],
        auth_id: null,
        actif: true,
        user_id: null,
      });
      return;
    }
    const { data } = await supabase
      .from("utilisateurs")
      .select("role, mama_id, access_rights, actif")
      .eq("id", session.user.id)
      .maybeSingle();

    setUserData({
      role: data?.role || null,
      mama_id: data?.mama_id || null,
      access_rights: Array.isArray(data?.access_rights) ? data.access_rights : [],
      auth_id: session.user.id,
      actif: data?.actif ?? true,
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
        setUserData({
          role: null,
          mama_id: null,
          access_rights: [],
          auth_id: null,
          actif: true,
          user_id: null,
        });
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Déconnexion utilisateur
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserData({
      role: null,
      mama_id: null,
      access_rights: [],
      auth_id: null,
      actif: true,
      user_id: null,
    });
    window.location.href = "/login";
  };

  // Exporte le contexte
  const value = {
    ...userData,
    session,
    loading,
    login,
    logout,
    refreshUser,
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
