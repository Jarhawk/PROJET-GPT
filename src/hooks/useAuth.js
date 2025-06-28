import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function useAuth() {
  const ctx = useContext(AuthContext) || {};
  return {
    session: ctx.session,
    userData: ctx.userData,
    role: ctx.role,
    mama_id: ctx.mama_id,
    access_rights: ctx.access_rights,
    isLoading: ctx.isLoading,
    isAuthenticated: ctx.isAuthenticated,
    ...ctx,
  };
}
