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
import { extractAccessRightsFromRole } from "@/lib/roleUtils";
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
  const [mamaId, setMamaId] = useState(null);
  const [accessRights, setAccessRights] = useState(null);
  const [role, setRole] = useState(null);
  const [roleData, setRoleData] = useState(null);
  const [nom, setNom] = useState(null);
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


  // Chargement des données utilisateur et de son rôle depuis Supabase.
  // On récupère d'abord l'utilisateur via son auth_id, en forçant
  // la relation explicite vers la table `roles` pour obtenir les droits.
  // Les droits effectifs sont la fusion de ceux du rôle et de ceux
  // éventuellement stockés dans `utilisateurs.access_rights`.
  // Si aucun rôle n'est relié (role null), on logge un warning et
  // on continue avec des droits vides pour éviter un crash de l'app.
  async function fetchUserData(userId, email) {
    if (!userId) {
      console.warn("fetchUserData called without userId");
      return;
    }
    if (fetchingRef.current && lastUserIdRef.current === userId) return;
    fetchingRef.current = true;
    if (import.meta.env.DEV) {
      console.debug("fetchUserData", userId);
    }

    try {
      const { data, error } = await supabase
        .from("utilisateurs_complets")
        .select("*")
        .eq("auth_id", userId)
        .single();

      if (!data && !error) {
        console.warn("user not loaded", userId);
        setError("Utilisateur introuvable");
        setUserData(null);
        return;
      }

      if (error) {
        if (error.message && error.message.includes("column")) {
          console.error("fetchUserData column error", error.message);
          setError(error.message);
          setUserData(null);
          return;
        }
        throw error;
      }

      if (!data) {
        setError("Utilisateur introuvable");
        setUserData(null);
        return;
      }

      if (import.meta.env.DEV) {
        console.debug("fetchUserData result", data);
      }

      const roleInfo = {
        id: data.role_id,
        nom: data.role_nom,
        access_rights: data.role_access_rights || {},
      };

      const rights = mergeRights(
        extractAccessRightsFromRole(roleInfo),
        data.access_rights
      );

      lastUserIdRef.current = userId;
      setError(null);

      const newData = {
        ...data,
        auth_id: userId,
        email,
        nom: data.nom,
        access_rights: rights,
        roleData: roleInfo,
      };

      if (import.meta.env.DEV) {
        console.debug("Loaded user", { nom: newData.nom, rights: newData.access_rights });
      }

      setUserData(newData);
      setMamaId(data.mama_id);
      setAccessRights(rights);
      setRole(roleInfo.nom);
      setRoleData(roleInfo);
      setNom(data.nom);

      if (!data.mama_id) console.warn("missing mama_id for user", userId);
    } catch (err) {
      console.error("Erreur récupération utilisateur:", err);
      toast.error(err.message || "Erreur récupération utilisateur");
      setError(err.message || "Erreur inconnue");
      setUserData(null);
      setMamaId(null);
      setAccessRights(null);
      setRole(null);
      setRoleData(null);
      setNom(null);
    } finally {
      fetchingRef.current = false;
    }
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
      if (import.meta.env.DEV) {
        console.debug("loadSession", current?.user?.id);
      }
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
      if (import.meta.env.DEV) {
        console.debug("auth state change", newSession?.user?.id);
      }
      sessionLoadedRef.current = true;
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug("session", session);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoadedRef.current) return;
    if (!session) {
      setUserData(null);
      setMamaId(null);
      setAccessRights(null);
      setRole(null);
      setRoleData(null);
      setNom(null);
      purgeLocalAuth();
      if (pathname !== "/login") {
        navigate("/login");
      }
    }
  }, [session]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug("userData", userData);
    }
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
    if (import.meta.env.DEV) {
      console.debug('login', email);
    }
    const { data, error } = await loginUser(email, password);
    if (error) {
      toast.error(error.message || "Erreur");
      return { error };
    }
    await loadSession();
    if (data.session?.user?.id) {
      await fetchUserData(data.session.user.id, data.session.user.email);
    }
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
      await fetchUserData(data.session.user.id, data.session.user.email);
    }
    return { data };
  };

  const logout = async () => {
    if (import.meta.env.DEV) {
      console.debug('logout');
    }
    await supabase.auth.signOut();
    setSession(null);
    setUserData(null);
    setMamaId(null);
    setAccessRights(null);
    setRole(null);
    setRoleData(null);
    setNom(null);
    navigate("/login");
  };

  const isSuperadmin = checkAccess(accessRights, 'superadmin', 'peut_voir');

  const hasAccess = (module, droit = "peut_voir") => {
    return checkAccess(accessRights, module, droit, isSuperadmin);
  };

  const getAuthorizedModules = (droit = "peut_voir") => {
    return listModules(accessRights, droit);
  };
  const isAdmin =
    isSuperadmin || checkAccess(accessRights, 'admin', 'peut_voir');

  const value = {
    /** Direct session object returned by Supabase */
    session,
    userData,
    nom,
    access_rights: accessRights,
    mama_id: mamaId,
    role,
    roleData,
    /** Authentication state */
    loading,
    error,
    /** Authenticated user object from Supabase */
    user: session?.user || null,
    /** Convenience alias for `session?.user?.id` */
    user_id: session?.user?.id ?? null,
    /** Indicates the session is available but userData has not been fetched yet */
    pending: !!session && !loading && !userData && !error,
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
