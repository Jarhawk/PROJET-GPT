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
    loading,
    pending: ctx.pending,
    isAuthenticated: ctx.isAuthenticated,
    isSuperadmin: ctx.isSuperadmin,
    error: ctx.error,
  };
}
