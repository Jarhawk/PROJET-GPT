import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { login as loginUser } from "@/lib/loginUser";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lastUserIdRef = useRef(null);
  const fetchingRef = useRef(false);

  async function fetchUserData(userId) {
    if (fetchingRef.current && lastUserIdRef.current === userId) return;
    fetchingRef.current = true;
    console.log("fetchUserData", userId);
    const { data, error } = await supabase
      .from("utilisateurs")
      .select("role, mama_id, access_rights, actif")
      .eq("auth_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération utilisateur:", error);
      setError(error.message || "Erreur inconnue");
      setUserData(null);
      fetchingRef.current = false;
      return;
    }

    if (!data) {
      setUserData(null);
      if (pathname !== "/pending") navigate("/pending");
      fetchingRef.current = false;
      return;
    }

    lastUserIdRef.current = userId;
    setError(null);
    setUserData({ ...data, auth_id: userId, user_id: userId });
    fetchingRef.current = false;
  }

  async function loadSession() {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("loadSession", session?.user?.id);
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
      console.log("auth state change", newSession?.user?.id);
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
    error,
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
