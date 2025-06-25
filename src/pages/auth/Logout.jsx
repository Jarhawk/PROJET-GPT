import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Logout() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.signOut().then(() => {
      toast.success("Déconnecté");
      navigate("/login");
    });
  }, [navigate]);
  return <div className="p-8 text-center">Déconnexion…</div>;
}
