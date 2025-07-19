// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useNavigate } from "react-router-dom";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import BLForm from "./BLForm.jsx";
import GlassCard from "@/components/ui/GlassCard";
import { LiquidBackground } from "@/components/LiquidBackground";

export default function BLCreate() {
  const navigate = useNavigate();
  const { fournisseurs } = useFournisseurs();
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10">
        <BLForm fournisseurs={fournisseurs} onClose={() => navigate(-1)} />
      </GlassCard>
    </div>
  );
}
