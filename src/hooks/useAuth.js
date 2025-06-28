import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function useAuth() {
  const ctx = useContext(AuthContext) || {};
  const loading = ctx.loading ?? ctx.isLoading;
  return {
    session: ctx.session,
    userData: ctx.userData,
    mama_id: ctx.mama_id,
    access_rights: ctx.access_rights,
    role: ctx.role,
    loading,
  };
}
