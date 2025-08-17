// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useNavigate } from "react-router-dom";
import useFournisseurs from "@/hooks/data/useFournisseurs";
import BLForm from "./BLForm.jsx";
import GlassCard from "@/components/ui/GlassCard";
import { LiquidBackground } from "@/components/LiquidBackground";
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Unauthorized from "@/pages/auth/Unauthorized";

export default function BLCreate() {
  const navigate = useNavigate();
  const { data: fournisseurs = [] } = useFournisseurs({ actif: true });
  const { hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess("bons_livraison", "peut_modifier");

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10">
        <BLForm fournisseurs={fournisseurs} onClose={() => navigate(-1)} />
      </GlassCard>
    </div>
  );
}
