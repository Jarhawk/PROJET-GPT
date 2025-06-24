import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

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
    if (role === "superadmin") {
      const res = await supabase.from("mamas").select("id, nom").order("nom");
      if (!res.error) data = res.data;
    } else {
      const res = await supabase
        .from("users_mamas")
        .select("mamas(id, nom)")
        .eq("user_id", user_id)
        .eq("actif", true);
      if (!res.error) data = (res.data || []).map((r) => r.mamas);
    }
    setMamas(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const changeMama = (id) => {
    setMamaActifState(id);
    localStorage.setItem("mamaActif", id);
  };

  const value = { mamas, mamaActif, setMamaActif: changeMama, loading };

  return (
    <MultiMamaContext.Provider value={value}>{children}</MultiMamaContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMultiMama() {
  return useContext(MultiMamaContext) || {};
}
