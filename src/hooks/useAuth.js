// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function useAuth() {
  const ctx = useContext(AuthContext) || {};
  const loading = ctx.loading ?? ctx.isLoading;
  return {
    session: ctx.session,
    userData: ctx.userData,
    mama_id: ctx.userData?.mama_id ?? ctx.mama_id,
    access_rights: ctx.userData?.access_rights ?? ctx.access_rights,
    role: ctx.userData?.role ?? ctx.role,
    role_id: ctx.userData?.role_id ?? ctx.role_id,
    email: ctx.userData?.email ?? ctx.email,
    actif: ctx.userData?.actif ?? ctx.actif,
    loading,
    pending: ctx.pending,
    isAuthenticated: ctx.isAuthenticated,
    isSuperadmin: ctx.isSuperadmin,
    error: ctx.error,
  };
}
