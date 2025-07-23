import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import useAuth from "@/hooks/useAuth";

export default function useConsentements() {
  const { userData } = useAuth();
  const [data, setData] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    if (!supabase || !userData?.mama_id) return;

    const fetchConsentements = async () => {
      const { data, error } = await supabase
        .from("consentements_utilisateur")
        .select("*")
        .eq("mama_id", userData.mama_id);
      if (error) {
        console.error("Erreur chargement consentements:", error);
      } else {
        setData(data);
      }
    };

    fetchConsentements();
  }, [userData, supabase]);

  return { data };
}
