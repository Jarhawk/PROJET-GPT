import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/ui/GlassCard";
import useAuth from "@/hooks/useAuth";

export default function Pending() {
  const navigate = useNavigate();
  const { userData } = useAuth();

  useEffect(() => {
    if (userData) navigate("/dashboard");
  }, [userData, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-100 backdrop-blur-md bg-opacity-40">
      <GlassCard>
        <h2 className="text-xl font-semibold text-center text-mamastock">Compte en cours de création…</h2>
        <p className="text-center mt-2">Merci de patienter pendant l'initialisation de votre compte.</p>
      </GlassCard>
    </div>
  );
}
