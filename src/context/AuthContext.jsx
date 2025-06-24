// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticator } from "otplib";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// Contexte global Auth
// Exported separately for hooks like src/hooks/useAuth.js
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // Session Supabase
  const [userData, setUserData] = useState(null); // Données utilisateurs
  const [loading, setLoading] = useState(true); // Chargement initial/refresh
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function refreshUser(sessionParam) {
    const current = sessionParam || session;
    if (current) {
      setLoading(true);
      await fetchUserData(current);
      setLoading(false);
    }
  }

  // Login utilisateur avec gestion 2FA
  const login = async ({ email, password, totp }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const { session: newSession, user } = data;
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
    } catch (err) {
      toast.error(err?.message || "Échec de la connexion");
      return { error: err?.message };
    }
  };

  async function fetchUserData(session) {
    if (!session?.user) {
      setUserData(null);
      return;
    }
    const { data, error, status } = await supabase
      .from("utilisateurs")
      .select("role, mama_id, access_rights, actif")
      .eq("auth_id", session.user.id)
      .maybeSingle();

    if (error && status !== 406) {
      setError(error.message);
      toast.error(error.message);
      return;
    }

    if (!data) {
      // Row not yet created
      setUserData(null);
      return;
    }

    if (data && data.actif === false) {
      await supabase.auth.signOut();
      setSession(null);
      setUserData({
        role: null,
        mama_id: null,
        access_rights: [],
        auth_id: session.user.id,
        actif: false,
        user_id: session.user.id,
      });
      navigate("/blocked");
      return;
    }

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
        setUserData(null);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Déconnexion utilisateur
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserData(null);
    navigate("/login");
  };

  // Exporte le contexte
  const value = {
    role: userData?.role ?? null,
    mama_id: userData?.mama_id ?? null,
    access_rights: userData?.access_rights ?? [],
    auth_id: userData?.auth_id ?? null,
    actif: userData?.actif ?? true,
    user_id: userData?.user_id ?? null,
    session,
    loading,
    error,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!session,
    isAdmin: userData?.role === "admin" || userData?.role === "superadmin",
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
