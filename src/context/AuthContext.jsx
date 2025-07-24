// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { login as loginUser } from "@/lib/loginUser";
import {
  hasAccess as checkAccess,
  getAuthorizedModules as listModules,
  mergeRights,
} from "@/lib/access";
import toast from "react-hot-toast";

export const AuthContext = createContext(null); // eslint-disable-line react-refresh/only-export-components

export function useAuth() { // eslint-disable-line react-refresh/only-export-components
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lastUserIdRef = useRef(null);
  const fetchingRef = useRef(false);
  const sessionLoadedRef = useRef(false);

  function purgeLocalAuth() {
    try { localStorage.clear(); } catch { /* ignore */ }
    try { sessionStorage.clear(); } catch { /* ignore */ }
    try {
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/');
      });
    } catch { /* ignore */ }
  }

  const resetAuth = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore signOut errors */
    }
    purgeLocalAuth();
    window.location.reload();
  };


  async function fetchUserData(userId, email) {
    if (!userId) {
      console.warn("fetchUserData called without userId");
      return;
    }
    if (fetchingRef.current && lastUserIdRef.current === userId) return;
    fetchingRef.current = true;
    if (import.meta.env.DEV) console.log("fetchUserData", userId);
    let { data, error } = await supabase
      .from("utilisateurs")
      .select("id, mama_id, nom, access_rights, actif, email, role_id, role:roles(id, nom, access_rights)")
      .eq("auth_id", userId)
      .maybeSingle();

    if (!data && !error && email) {
      const res = await supabase
        .from("utilisateurs")
        .select("id, mama_id, nom, access_rights, actif, email, role_id, role:roles(id, nom, access_rights)")
        .eq("email", email)
        .maybeSingle();
      data = res.data;
      error = res.error;
    }
    if (import.meta.env.DEV) console.log("fetchUserData result", data);

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

    const roleRights = data.role?.access_rights || {};
    const userRights = data.access_rights || {};
    const rights = mergeRights(roleRights, userRights);

    lastUserIdRef.current = userId;
    setError(null);
    const newData = {
      ...data,
      auth_id: userId,
      email,
      nom: data.nom,
      access_rights: rights,
      role_id: data.role_id,
      role: data.role?.nom || null,
    };
    if (import.meta.env.DEV) {
      console.log('Loaded user', { nom: newData.nom, rights: newData.access_rights });
    }
    setUserData(newData);
    if (!data.mama_id) console.warn("missing mama_id for user", userId);
    fetchingRef.current = false;
  }

  async function loadSession() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("loadSession error", error.message);
        setError(error.message);
        if (/invalid.*token/i.test(error.message)) {
          purgeLocalAuth();
        }
      }
      const current = data?.session ?? null;
      if (import.meta.env.DEV) console.log("loadSession", current?.user?.id);
      sessionLoadedRef.current = true;
      setSession(current);
    } catch (e) {
      console.error("loadSession failure", e);
      setError(e.message || "loadSession error");
    } finally {
      setLoading(false);
    }
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
    if (import.meta.env.DEV) console.log("session", session);
  }, [session]);

  useEffect(() => {
    if (!sessionLoadedRef.current) return;
    if (!session) {
      setUserData(null);
      purgeLocalAuth();
      if (pathname !== "/login") {
        navigate("/login");
      }
    }
  }, [session]);

  useEffect(() => {
    if (import.meta.env.DEV) console.log("userData", userData);
  }, [userData]);

  useEffect(() => {
    if (import.meta.env.DEV) console.debug('auth state', { session, userData });
  }, [session, userData]);

  useEffect(() => {
    if (!sessionLoadedRef.current) return;
    if (!session?.user?.id) {
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

  useEffect(() => {
    if (!userData) return;
    if (userData.actif === false && pathname !== "/blocked") {
      supabase.auth.signOut().catch(() => {});
      navigate("/blocked");
    }
  }, [userData, pathname, navigate]);

  const login = async ({ email, password }) => {
    if (import.meta.env.DEV) console.log('login', email);
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
        await supabase.from("utilisateurs").insert({
          auth_id: user.id,
          mama_id: mama?.id,
          nom: user.email,
          access_rights: {},
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
    if (import.meta.env.DEV) console.log('logout');
    await supabase.auth.signOut();
    setSession(null);
    setUserData(null);
    navigate("/login");
  };

  const hasAccess = (module, droit = "peut_voir") => {
    return checkAccess(userData?.access_rights, module, droit, false);
  };

  const getAuthorizedModules = (droit = "peut_voir") => {
    return listModules(userData?.access_rights, droit);
  };

  const isSuperadmin = checkAccess(userData?.access_rights, 'superadmin', 'peut_voir');
  const isAdmin =
    isSuperadmin || checkAccess(userData?.access_rights, 'admin', 'peut_voir');

  const value = {
    /** Direct session object returned by Supabase */
    session,
    userData,
    nom: userData?.nom,
    access_rights: userData?.access_rights ?? null,
    mama_id: userData?.mama_id,
    role: userData?.role,
    /** Authentication state */
    loading,
    error,
    /** Authenticated user object from Supabase */
    user: session?.user || null,
    /** Convenience alias for `session?.user?.id` */
    user_id: session?.user?.id ?? null,
    /** Indicates the session is available but userData has not been fetched yet */
    pending: !!session && !userData,
    email: userData?.email,
    actif: userData?.actif,
    isSuperadmin,
    isAdmin,
    hasAccess,
    getAuthorizedModules,
    login,
    signup,
    logout,
    resetAuth,
    /** Helpers */
    isAuthenticated: !!session?.user?.id,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
