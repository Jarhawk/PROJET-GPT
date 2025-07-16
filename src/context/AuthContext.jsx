// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { login as loginUser } from "@/lib/loginUser";
import toast from "react-hot-toast";

// eslint-disable-next-line react-refresh/only-export-components
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
  const sessionLoadedRef = useRef(false);

  async function fetchUserData(userId, email) {
    if (!userId) {
      console.warn("fetchUserData called without userId");
      return;
    }
    if (fetchingRef.current && lastUserIdRef.current === userId) return;
    fetchingRef.current = true;
    if (import.meta.env.DEV) console.log("fetchUserData", userId);
    const { data, error } = await supabase
      .from("utilisateurs")
      .select("id, mama_id, role_id, role:roles(nom, access_rights), access_rights, actif")
      .eq("auth_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération utilisateur:", error);
      toast.error(error.message || "Erreur récupération utilisateur");
      setError(error.message || "Erreur inconnue");
      setUserData(null);
      fetchingRef.current = false;
      return;
    }

    if (!data) {
      console.warn("user not loaded", userId);
      setUserData(null);
      if (pathname !== "/pending") navigate("/pending");
      fetchingRef.current = false;
      return;
    }

    lastUserIdRef.current = userId;
    setError(null);
    setUserData({
      ...data,
      auth_id: userId,
      user_id: userId,
      role: data.role?.nom ?? data.role,
      access_rights: data.role?.access_rights ?? data.access_rights,
      email,
    });
    if (!data.mama_id) console.warn("missing mama_id for user", userId);
    fetchingRef.current = false;
  }

  async function loadSession() {
    setLoading(true);
    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn("loadSession error", error.message);
    const current = data?.session ?? null;
    sessionLoadedRef.current = true;
    setSession(current);
  }

  useEffect(() => {
    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (import.meta.env.DEV) console.log("auth state change", newSession?.user?.id);
      sessionLoadedRef.current = true;
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionLoadedRef.current) return;
    if (!session || !session.user) {
      if (!session) console.warn("session is null");
      setUserData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchUserData(session.user.id, session.user.email).finally(() => {
      setLoading(false);
    });
  }, [session]);

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

    const user = data.user;
    if (user) {
      try {
        const { data: mama } = await supabase
          .from("mamas")
          .select("id")
          .order("created_at")
          .limit(1)
          .maybeSingle();
        const { data: roleRow } = await supabase
          .from("roles")
          .select("id")
          .eq("nom", "user")
          .maybeSingle();
        await supabase.from("utilisateurs").insert({
          auth_id: user.id,
          mama_id: mama?.id,
          role_id: roleRow?.id,
          access_rights: [],
        });
      } catch (e) {
        console.error("Erreur création profil utilisateur:", e);
      }
    }

    if (data.session) {
      sessionLoadedRef.current = true;
      setSession(data.session);
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
    /** Authenticated user object from Supabase */
    user: session?.user || null,
    /** Convenience alias for `session?.user?.id` */
    user_id: session?.user?.id ?? null,
    /** Direct session object returned by Supabase */
    session,
    /** Authentication state */
    loading,
    error,
    /** Indicates the session is available but userData has not been fetched yet */
    pending: !!session && !userData,
    /** Selected fields from userData for easy access */
    role: userData?.role,
    role_id: userData?.role_id,
    mama_id: userData?.mama_id,
    email: userData?.email,
    actif: userData?.actif,
    access_rights: userData?.access_rights,
    login,
    signup,
    logout,
    /** Helpers */
    isAuthenticated: !!session?.user?.id,
    isAdmin: userData?.role === "admin" || userData?.role === "superadmin",
    isSuperadmin: userData?.role === "superadmin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext) || {};
}
