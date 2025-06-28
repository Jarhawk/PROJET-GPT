import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { login as loginUser } from "@/lib/loginUser";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchUserData(userId) {
    const { data, error } = await supabase
      .from("utilisateurs")
      .select("role, mama_id, access_rights, actif")
      .eq("auth_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération utilisateur:", error);
      setUserData(null);
      return;
    }

    if (!data) {
      setUserData(null);
      navigate("/pending");
      return;
    }

    setUserData({ ...data, auth_id: userId, user_id: userId });
  }

  async function loadSession() {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session?.user?.id) {
      await fetchUserData(session.user.id);
    } else {
      setUserData(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        fetchUserData(newSession.user.id);
      } else {
        setUserData(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
    const { data, error } = await loginUser(email, password);
    if (error) {
      toast.error(error.message || "Erreur");
      return { error };
    }
    await loadSession();
    return { data };
  };

  const signup = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message || "Erreur");
      return { error };
    }
    if (data.session) {
      setSession(data.session);
      if (data.session.user) await fetchUserData(data.session.user.id);
    }
    return { data };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserData(null);
    navigate("/login");
  };

  const value = {
    userData,
    session,
    loading,
    pending: !!session && !userData,
    login,
    signup,
    logout,
    isAuthenticated: !!session?.user?.id,
    isAdmin: userData?.role === "admin" || userData?.role === "superadmin",
    isSuperadmin: userData?.role === "superadmin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext) || {};
}
