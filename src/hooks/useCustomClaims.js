// src/hooks/useCustomClaims.js
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useCustomClaims = (session) => {
  const { setRole, setMamaId, setAccessRights } = useAuth();

  useEffect(() => {
    const fetchClaims = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase.rpc("get_user_claims", {
        uid: session.user.id,
      });

      if (error) {
        console.error("Erreur get_user_claims:", error.message);
        return;
      }

      if (data) {
        // ✅ Utilisation directe du JSONB retourné
        setRole(data.role);
        setMamaId(data.mama_id);
        setAccessRights(data.access_rights || {});
        console.info("🎯 Custom claims appliqués", data);
      } else {
        console.warn("⚠️ get_user_claims a retourné null ou vide.");
      }
    };

    fetchClaims();
  }, [session, setRole, setMamaId, setAccessRights]);
};
