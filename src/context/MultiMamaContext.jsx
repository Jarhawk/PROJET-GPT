import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const MultiMamaContext = createContext();

export function MultiMamaProvider({ children }) {
  const { user_id, role, mama_id: authMamaId } = useAuth();
  const [mamas, setMamas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mamaActif, setMamaActifState] = useState(
    localStorage.getItem("mamaActif") || authMamaId
  );

  useEffect(() => {
    if (authMamaId && !mamaActif) {
      setMamaActifState(authMamaId);
    }
  }, [authMamaId]);

  useEffect(() => {
    if (user_id) fetchMamas();
  }, [user_id, role]);

  async function fetchMamas() {
    setLoading(true);
    let data = [];
    try {
      if (role === "superadmin") {
        const { data: rows, error } = await supabase
          .from("mamas")
          .select("id, nom")
          .order("nom");
        if (error) throw error;
        data = rows || [];
      } else {
        const { data: rows, error } = await supabase
          .from("users_mamas")
          .select("mamas(id, nom)")
          .eq("user_id", user_id)
          .eq("actif", true);
        if (error) throw error;
        data = (rows || []).map((r) => r.mamas);
      }
    } catch (err) {
      toast.error(err.message || "Erreur chargement établissements");
    }
    setMamas(Array.isArray(data) ? data : []);
    if (!mamaActif && Array.isArray(data) && data.length > 0) {
      changeMama(data[0].id);
    }
    setLoading(false);
  }

  const changeMama = (id) => {
    setMamaActifState(id);
    localStorage.setItem("mamaActif", id);
  };

  const value = { mamas, mamaActif, setMamaActif: changeMama, loading };

  if (loading && mamas.length === 0) {
    return <LoadingSpinner message="Chargement établissements..." />;
  }

  return (
    <MultiMamaContext.Provider value={value}>{children}</MultiMamaContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMultiMama() {
  return useContext(MultiMamaContext) || {};
}
