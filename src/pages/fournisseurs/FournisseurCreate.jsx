import { useNavigate } from "react-router-dom";
import SupplierForm from "@/components/fournisseurs/SupplierForm";
import GlassCard from "@/components/ui/GlassCard";
import { LiquidBackground } from "@/components/LiquidBackground";

export default function FournisseurCreate() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10">
        <SupplierForm onClose={() => navigate(-1)} glass />
      </GlassCard>
    </div>
  );
}
