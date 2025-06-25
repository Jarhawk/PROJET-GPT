// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticator } from "otplib";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// Contexte global Auth
// Exported separately for hooks like src/hooks/useAuth.js
// eslint-disable-next-line react-refresh/only-export-components
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
  const [pending, setPending] = useState(false); // ligne utilisateurs manquante
  const navigate = useNavigate();

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
      console.debug('login response', { data, error });
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

  // Création de compte
  const signup = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        await fetchUserData(data.session);
      }
      return { data };
    } catch (err) {
      toast.error(err?.message || "Erreur");
      return { error: err?.message || "Erreur" };
    }
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
      setPending(false);
      return;
    }

    const meta = session.user.user_metadata || {};
    const { data, error, status } = await supabase
      .from("utilisateurs")
      .select("role, mama_id, access_rights, actif")
      .eq("auth_id", session.user.id)
      .maybeSingle();

    if (error && status !== 406) {
      if (status === 400) navigate("/unauthorized");
      toast.error(error.message);
      return;
    }

    if (!data) {
      setPending(true);
      setUserData({
        role: meta.role ?? null,
        mama_id: meta.mama_id ?? null,
        access_rights: Array.isArray(meta.access_rights) ? meta.access_rights : null,
        auth_id: session.user.id,
        actif: true,
        user_id: session.user.id,
      });
      return;
    }

    setPending(false);

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
      window.location.href = "/blocked";
      return;
    }

    setUserData({
      role: data?.role ?? meta.role ?? null,
      mama_id: data?.mama_id ?? meta.mama_id ?? null,
      access_rights: Array.isArray(data?.access_rights)
        ? data.access_rights
        : Array.isArray(meta.access_rights)
        ? meta.access_rights
        : [],
      auth_id: session.user.id,
      actif: data?.actif ?? true,
      user_id: session.user.id,
    });
  }

  // Initialisation / listener session Supabase
  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('DEBUG context initial', session);
      setSession(session);
      if (session) await fetchUserData(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('DEBUG context change', session);
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
        setPending(false);
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
    setPending(false);
    navigate("/login");
  };

  // Exporte le contexte
  const value = {
    ...userData,
    session,
    user: session?.user || null,
    loading,
    pending,
    login,
    signup,
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
