// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from '@/hooks/useAuth';
import PageWrapper from "@/components/ui/PageWrapper";
import GlassCard from "@/components/ui/GlassCard";

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  useEffect(() => {
    logout().then(() => {
      toast.success("Déconnecté");
      navigate("/login");
    });
  }, [logout, navigate]);
  return (
    <PageWrapper>
      <GlassCard className="text-center">Déconnexion…</GlassCard>
    </PageWrapper>
  );
}
