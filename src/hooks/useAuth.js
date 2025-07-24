// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export function useAuth() {
  const ctx = useContext(AuthContext) || {};
  if (import.meta.env.DEV) console.log('useAuth hook', ctx);
  if (!ctx || typeof ctx.login !== 'function') {
    throw new Error(
      "useAuth n’est pas correctement initialisé (provider absent ou mal injecté) !"
    );
  }
  const loading = ctx.loading ?? ctx.isLoading;
  const roleName = ctx.userData?.role?.nom ?? ctx.role?.nom ?? ctx.role ?? null;
  return {
    session: ctx.session,
    userData: ctx.userData,
    mama_id: ctx.userData?.mama_id ?? ctx.mama_id ?? null,
    nom: ctx.userData?.nom ?? ctx.nom,
    access_rights: ctx.userData?.access_rights ?? ctx.access_rights ?? {},
    role: roleName,
    roleData: ctx.userData?.role ?? ctx.roleData ?? null,
    email: ctx.userData?.email ?? ctx.email,
    actif: ctx.userData?.actif ?? ctx.actif,
    isSuperadmin: ctx.isSuperadmin,
    isAdmin: ctx.isAdmin,
    loading,
    pending: ctx.pending,
    isAuthenticated: ctx.isAuthenticated,
    hasAccess: ctx.hasAccess,
    getAuthorizedModules: ctx.getAuthorizedModules,
    error: ctx.error,
    resetAuth: ctx.resetAuth,
    login: ctx.login,
    signup: ctx.signup,
    logout: ctx.logout,
  };
}

export default useAuth;
