// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export function useAuth() {
  const ctx = useContext(AuthContext) || {};
  if (import.meta.env.DEV) {
    console.debug('useAuth hook', ctx);
  }
  if (!ctx || typeof ctx.login !== 'function') {
    throw new Error(
      "useAuth n’est pas correctement initialisé (provider absent ou mal injecté) !"
    );
  }
  const loading = ctx.loading ?? ctx.isLoading ?? false;
  const roleName =
    ctx.role ??
    ctx.userData?.roleData?.nom ??
    ctx.roleData?.nom ??
    null;
  const rights = ctx.access_rights ?? ctx.userData?.access_rights ?? {};
  const mamaId = ctx.userData?.mama_id ?? ctx.mama_id ?? null;
  return {
    session: ctx.session ?? null,
    user: ctx.user ?? ctx.session?.user ?? null,
    userData: ctx.userData ?? null,
    user_id: ctx.user_id ?? ctx.session?.user?.id ?? null,
    mama_id: mamaId,
    nom: ctx.userData?.nom ?? ctx.nom ?? null,
    access_rights: rights,
    role: roleName,
    roleData: ctx.userData?.roleData ?? ctx.roleData ?? null,
    email: ctx.userData?.email ?? ctx.email ?? null,
    actif: ctx.userData?.actif ?? ctx.actif ?? null,
    isSuperadmin: ctx.isSuperadmin ?? false,
    isAdmin: ctx.isAdmin ?? false,
    loading,
    pending: ctx.pending ?? false,
    isAuthenticated: ctx.isAuthenticated ?? !!ctx.session?.user?.id,
    hasAccess: ctx.hasAccess ?? (() => false),
    getAuthorizedModules: ctx.getAuthorizedModules ?? (() => []),
    error: ctx.error ?? null,
    resetAuth: ctx.resetAuth ?? (() => {}),
    login: ctx.login,
    signup: ctx.signup,
    logout: ctx.logout,
  };
}

export default useAuth;
