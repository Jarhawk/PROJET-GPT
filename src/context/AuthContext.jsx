// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticator } from "otplib";
import { supabase } from "@/lib/supabase";
import { loginUser } from "@/lib/loginUser";
import toast from "react-hot-toast";

// Contexte global Auth
// Exported separately for hooks like src/hooks/useAuth.js
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true); // Chargement initial/refresh
  const [session, setSession] = useState(null); // Session Supabase
  const [userData, setUserData] = useState(null);
  const [pending, setPending] = useState(false); // ligne utilisateurs manquante
  const navigate = useNavigate();

  async function refreshUser(sessionParam) {
    const current = sessionParam || session;
    if (current?.user) await fetchUserData(current.user.id);
  }

  // Login utilisateur avec gestion 2FA
  const login = async ({ email, password, totp }) => {
    const result = await loginUser(email, password);
    if (result.errorCode) {
      if (result.errorMessage) toast.error(result.errorMessage);
      if (result.errorCode === 500) toast.error("Erreur serveur Supabase (500)");
      return { error: result.errorMessage || "Erreur" };
    }
    const { user } = result;
    const {
      data: { session: newSession },
    } = await supabase.auth.getSession();
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
    if (newSession?.user) await fetchUserData(newSession.user.id);
    return { data: newSession };
  };

  // Création de compte
  const signup = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const authId = data.user?.id;
      if (authId) {
        await supabase.from("utilisateurs").insert({
          auth_id: authId,
          email,
          role: "user",
          access_rights: {},
          actif: true,
        });
      }

      if (data.session) {
        setSession(data.session);
        if (data.session.user) await fetchUserData(data.session.user.id);
      }

      return { data };
    } catch (err) {
      toast.error(err?.message || "Erreur");
      return { error: err?.message || "Erreur" };
    }
  };

  const fetchUserData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("utilisateurs")
        .select("role, mama_id, access_rights, actif")
        .eq("auth_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setPending(true);
        setUserData(null);
        return;
      }

      setPending(false);

      if (data.actif === false) {
        await supabase.auth.signOut();
        setSession(null);
        setUserData({ ...data, auth_id: userId, user_id: userId });
        window.location.href = "/blocked";
        return;
      }

      setUserData({ ...data, auth_id: userId, user_id: userId });
    } catch (error) {
      console.error("Erreur récupération utilisateur:", error);
      setUserData(null);
      setSession(null);
      setPending(false);
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Sign out error:", e);
      }
    }
  };

  // Initialisation / listener session Supabase
  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setLoading(true);
        fetchUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setUserData(null);
        setPending(false);
        setLoading(false);
      }
    });

    const refreshInterval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setSession(session);
      });
    }, 1000 * 60 * 10);

    return () => {
      listener?.subscription?.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  // Déconnexion utilisateur
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserData(null);
    setPending(false);
    navigate("/login");
  };

  // Exporte le contexte
  const value = {
    ...(userData || {}),
    userData,
    session,
    user: session?.user || null,
    loading,
    isLoading: loading,
    pending,
    login,
    signup,
    logout,
    refreshUser,
    isAuthenticated: !!session,
    isAdmin: userData?.role === "admin" || userData?.role === "superadmin",
    isSuperadmin: userData?.role === "superadmin",
  };

  useEffect(() => {
    console.log("[AUTH DEBUG]", { session, userData });
  }, [session, userData]);

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
